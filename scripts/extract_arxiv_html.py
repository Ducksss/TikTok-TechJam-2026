#!/usr/bin/env python3
"""Extract prompt-friendly text from an arXiv HTML paper using the stdlib."""

from __future__ import annotations

import argparse
import html
import re
from html.parser import HTMLParser
from pathlib import Path


BLOCK_TAGS = {
    "address",
    "article",
    "blockquote",
    "caption",
    "dd",
    "div",
    "dl",
    "dt",
    "figcaption",
    "figure",
    "footer",
    "form",
    "header",
    "hr",
    "main",
    "ol",
    "p",
    "section",
    "table",
    "tbody",
    "tfoot",
    "thead",
    "tr",
    "ul",
}
HEADING_TAGS = {f"h{level}": level for level in range(1, 7)}
SKIPPED_TAGS = {"button", "form", "noscript", "script", "style", "svg"}


class ArticleTextExtractor(HTMLParser):
    """Extract the paper article while omitting arXiv page chrome and scripts."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self._article_depth = 0
        self._math_depth = 0
        self._skip_depth = 0
        self._tokens: list[str] = []

    @property
    def in_article(self) -> bool:
        return self._article_depth > 0

    def _newline(self, count: int = 1) -> None:
        self._tokens.append("\n" * count)

    def _text(self, value: str) -> None:
        normalized = re.sub(r"\s+", " ", html.unescape(value)).strip()
        if normalized and normalized != "•":
            self._tokens.append(normalized + " ")

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = dict(attrs)
        if tag == "article":
            self._article_depth += 1
            self._newline(2)
            return
        if not self.in_article:
            return
        if self._skip_depth:
            self._skip_depth += 1
            return
        if tag in SKIPPED_TAGS:
            self._skip_depth = 1
            return
        if self._math_depth:
            self._math_depth += 1
            return
        if tag == "math":
            self._text(attributes.get("alttext") or "[mathematical expression]")
            self._math_depth = 1
            return
        if tag in HEADING_TAGS:
            self._newline(2)
            self._tokens.append("#" * HEADING_TAGS[tag] + " ")
        elif tag == "li":
            self._newline()
            self._tokens.append("- ")
        elif tag in {"td", "th"}:
            self._tokens.append(" | ")
        elif tag == "br":
            self._newline()
        elif tag == "img":
            alt = attributes.get("alt")
            if alt:
                self._text(f"[Figure: {alt}]")
        elif tag in BLOCK_TAGS:
            self._newline()

    def handle_endtag(self, tag: str) -> None:
        if tag == "article" and self.in_article:
            self._newline(2)
            self._article_depth -= 1
            return
        if not self.in_article:
            return
        if self._skip_depth:
            self._skip_depth -= 1
            return
        if self._math_depth:
            self._math_depth -= 1
            return
        if tag in HEADING_TAGS or tag in BLOCK_TAGS or tag == "li":
            self._newline()

    def handle_data(self, data: str) -> None:
        if self.in_article and not self._skip_depth and not self._math_depth:
            self._text(data)

    def text(self) -> str:
        joined = "".join(self._tokens).replace("\u00a0", " ")
        lines = [re.sub(r"[ \t]+", " ", line).strip() for line in joined.splitlines()]
        output: list[str] = []
        blank = False
        for line in lines:
            if not line:
                if output and not blank:
                    output.append("")
                blank = True
                continue
            output.append(line)
            blank = False
        return "\n".join(output).strip() + "\n"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Extract the <article> text from an arXiv HTML snapshot."
    )
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    source = args.input.read_text(encoding="utf-8")
    if "<article" not in source or "arXiv:" not in source or "CC BY 4.0" not in source:
        raise SystemExit("input is not an expected CC BY 4.0 arXiv HTML article")
    extractor = ArticleTextExtractor()
    extractor.feed(source)
    rendered = extractor.text()
    if len(rendered) < 10_000 or not rendered.startswith("# "):
        raise SystemExit("extraction is unexpectedly short or has no title")
    args.output.write_text(rendered, encoding="utf-8")


if __name__ == "__main__":
    main()

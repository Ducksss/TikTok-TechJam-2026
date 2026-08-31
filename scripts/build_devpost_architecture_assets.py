#!/usr/bin/env python3
"""Build deterministic SynthFlag Devpost architecture SVG assets.

The output is intentionally text-first and code-generated: the labels, metrics,
and diagram routing need to remain exact and reviewable. PNG export is handled
separately with the platform SVG renderer so the SVG files remain the editable
masters.
"""

from __future__ import annotations

from dataclasses import dataclass
from html import escape
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "submission" / "media" / "devpost-gallery"
WIDTH = 1536
HEIGHT = 1024


@dataclass(frozen=True)
class Theme:
    name: str
    background: str
    grid: str
    card: str
    card_alt: str
    text: str
    muted: str
    line: str
    blue: str
    blue_soft: str
    sky: str
    green: str
    amber: str
    red: str


THEMES = {
    "dark": Theme(
        name="dark",
        background="#07111F",
        grid="#13213A",
        card="#0E1B30",
        card_alt="#132541",
        text="#F8FAFF",
        muted="#AFC2E2",
        line="#2A4672",
        blue="#2970FF",
        blue_soft="#123A82",
        sky="#79A8FF",
        green="#45D39A",
        amber="#F2C14E",
        red="#FF7184",
    ),
    "light": Theme(
        name="light",
        background="#F4F7FE",
        grid="#DDE7FA",
        card="#FFFFFF",
        card_alt="#EDF3FF",
        text="#111827",
        muted="#53627A",
        line="#C4D5F3",
        blue="#0040C1",
        blue_soft="#DCE8FF",
        sky="#2970FF",
        green="#087A55",
        amber="#A06400",
        red="#C83349",
    ),
}


class Svg:
    def __init__(self, theme: Theme, title: str, description: str) -> None:
        self.theme = theme
        self.items: list[str] = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{WIDTH}" height="{HEIGHT}" '
            f'viewBox="0 0 {WIDTH} {HEIGHT}" role="img" aria-labelledby="title desc">',
            f"<title id=\"title\">{escape(title)}</title>",
            f"<desc id=\"desc\">{escape(description)}</desc>",
            "<defs>",
            f'<pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">'
            f'<path d="M 32 0 L 0 0 0 32" fill="none" stroke="{theme.grid}" '
            'stroke-width="1" opacity="0.55"/></pattern>',
            f'<filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">'
            f'<feDropShadow dx="0" dy="12" stdDeviation="18" flood-color="#000000" '
            f'flood-opacity="{0.28 if theme.name == "dark" else 0.10}"/></filter>',
            f'<marker id="arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" '
            f'orient="auto" markerUnits="strokeWidth"><path d="M0,0 L12,6 L0,12 Z" '
            f'fill="{theme.sky}"/></marker>',
            "</defs>",
            f'<rect width="{WIDTH}" height="{HEIGHT}" fill="{theme.background}"/>',
            f'<rect width="{WIDTH}" height="{HEIGHT}" fill="url(#grid)"/>',
        ]

    def add(self, markup: str) -> None:
        self.items.append(markup)

    def rect(
        self,
        x: float,
        y: float,
        width: float,
        height: float,
        *,
        fill: str | None = None,
        stroke: str | None = None,
        radius: float = 24,
        stroke_width: float = 2,
        opacity: float | None = None,
        shadow: bool = False,
    ) -> None:
        attrs = [
            f'x="{x}"',
            f'y="{y}"',
            f'width="{width}"',
            f'height="{height}"',
            f'rx="{radius}"',
            f'fill="{fill or self.theme.card}"',
        ]
        if stroke:
            attrs.extend([f'stroke="{stroke}"', f'stroke-width="{stroke_width}"'])
        if opacity is not None:
            attrs.append(f'opacity="{opacity}"')
        if shadow:
            attrs.append('filter="url(#shadow)"')
        self.add("<rect " + " ".join(attrs) + "/>")

    def line(
        self,
        x1: float,
        y1: float,
        x2: float,
        y2: float,
        *,
        color: str | None = None,
        width: float = 3,
        arrow: bool = False,
        dash: str | None = None,
        opacity: float | None = None,
    ) -> None:
        attrs = [
            f'x1="{x1}"',
            f'y1="{y1}"',
            f'x2="{x2}"',
            f'y2="{y2}"',
            f'stroke="{color or self.theme.line}"',
            f'stroke-width="{width}"',
            'stroke-linecap="round"',
        ]
        if arrow:
            attrs.append('marker-end="url(#arrow)"')
        if dash:
            attrs.append(f'stroke-dasharray="{dash}"')
        if opacity is not None:
            attrs.append(f'opacity="{opacity}"')
        self.add("<line " + " ".join(attrs) + "/>")

    def path(
        self,
        d: str,
        *,
        fill: str = "none",
        stroke: str | None = None,
        width: float = 3,
        arrow: bool = False,
        dash: str | None = None,
    ) -> None:
        attrs = [f'd="{d}"', f'fill="{fill}"']
        if stroke:
            attrs.extend(
                [
                    f'stroke="{stroke}"',
                    f'stroke-width="{width}"',
                    'stroke-linecap="round"',
                    'stroke-linejoin="round"',
                ]
            )
        if arrow:
            attrs.append('marker-end="url(#arrow)"')
        if dash:
            attrs.append(f'stroke-dasharray="{dash}"')
        self.add("<path " + " ".join(attrs) + "/>")

    def circle(
        self,
        cx: float,
        cy: float,
        radius: float,
        *,
        fill: str,
        stroke: str | None = None,
        stroke_width: float = 2,
    ) -> None:
        attrs = [f'cx="{cx}"', f'cy="{cy}"', f'r="{radius}"', f'fill="{fill}"']
        if stroke:
            attrs.extend([f'stroke="{stroke}"', f'stroke-width="{stroke_width}"'])
        self.add("<circle " + " ".join(attrs) + "/>")

    def text(
        self,
        x: float,
        y: float,
        value: str,
        *,
        size: int = 26,
        color: str | None = None,
        weight: int = 500,
        anchor: str = "start",
        family: str = "Instrument Sans, Poppins, Arial, sans-serif",
        letter_spacing: float | None = None,
        opacity: float | None = None,
    ) -> None:
        attrs = [
            f'x="{x}"',
            f'y="{y}"',
            f'font-family="{family}"',
            f'font-size="{size}"',
            f'font-weight="{weight}"',
            f'fill="{color or self.theme.text}"',
            f'text-anchor="{anchor}"',
        ]
        if letter_spacing is not None:
            attrs.append(f'letter-spacing="{letter_spacing}"')
        if opacity is not None:
            attrs.append(f'opacity="{opacity}"')
        self.add("<text " + " ".join(attrs) + f">{escape(value)}</text>")

    def multiline(
        self,
        x: float,
        y: float,
        lines: list[str],
        *,
        size: int = 24,
        color: str | None = None,
        weight: int = 500,
        leading: float = 1.28,
        anchor: str = "start",
    ) -> None:
        for index, line in enumerate(lines):
            self.text(
                x,
                y + index * size * leading,
                line,
                size=size,
                color=color,
                weight=weight,
                anchor=anchor,
            )

    def pill(
        self,
        x: float,
        y: float,
        width: float,
        label: str,
        *,
        fill: str,
        text_color: str,
        stroke: str | None = None,
        height: float = 34,
        size: int = 16,
    ) -> None:
        self.rect(
            x,
            y,
            width,
            height,
            fill=fill,
            stroke=stroke,
            radius=height / 2,
            stroke_width=1.5,
        )
        self.text(
            x + width / 2,
            y + height / 2 + size * 0.34,
            label,
            size=size,
            color=text_color,
            weight=700,
            anchor="middle",
            letter_spacing=0.7,
        )

    def finish(self) -> str:
        return "\n".join([*self.items, "</svg>", ""])


def add_brand_header(svg: Svg, eyebrow: str, title: str, subtitle: str) -> None:
    theme = svg.theme
    # Four rising bars are the compact SynthFlag signal mark.
    for index, height in enumerate((20, 30, 42, 54)):
        svg.rect(
            64 + index * 12,
            69 - height,
            8,
            height,
            fill=theme.blue if index < 3 else theme.sky,
            radius=4,
        )
    svg.text(124, 66, "SynthFlag", size=28, weight=800)
    svg.pill(
        1308,
        38,
        164,
        "TECHJAM 2026",
        fill=theme.blue_soft,
        text_color=theme.sky if theme.name == "dark" else theme.blue,
        stroke=theme.line,
        height=38,
        size=15,
    )
    svg.text(64, 125, eyebrow.upper(), size=17, color=theme.sky, weight=800, letter_spacing=2.2)
    svg.text(64, 172, title, size=43, weight=800)
    svg.text(64, 210, subtitle, size=20, color=theme.muted, weight=500)
    svg.line(64, 226, 1472, 226, color=theme.line, width=2)


def add_footer(svg: Svg, source: str) -> None:
    theme = svg.theme
    svg.line(64, 970, 1472, 970, color=theme.line, width=1.5)
    svg.text(64, 998, source, size=15, color=theme.muted, weight=500)
    svg.text(1472, 998, "Evidence before certainty", size=15, color=theme.sky, weight=700, anchor="end")


def add_section_label(svg: Svg, x: float, y: float, number: str, label: str) -> None:
    theme = svg.theme
    svg.circle(x + 17, y - 7, 17, fill=theme.blue)
    svg.text(x + 17, y - 1, number, size=15, color="#FFFFFF", weight=800, anchor="middle")
    svg.text(x + 46, y, label.upper(), size=15, color=theme.sky, weight=800, letter_spacing=1.5)


def build_system_architecture(theme: Theme) -> str:
    svg = Svg(
        theme,
        "SynthFlag overall system architecture",
        "A deterministic RGB image path through checkpoint verification, CLIP and SigLIP preprocessing, four experts, exact mean fusion, continuous scoring, and provenance-bound outputs.",
    )
    add_brand_header(
        svg,
        "Overall system architecture",
        "One image. Four experts. One review signal.",
        "Checkpoint identity and deterministic preprocessing stay visible from input to artifact.",
    )

    xs = [64, 326, 668, 1020, 1282]
    widths = [210, 290, 300, 210, 190]
    y = 266
    h = 500
    for x, width in zip(xs, widths):
        svg.rect(x, y, width, h, stroke=theme.line, shadow=True)

    # Step 1: RGB input.
    add_section_label(svg, 86, 310, "1", "Input")
    svg.rect(86, 344, 166, 136, fill=theme.card_alt, stroke=theme.line, radius=16)
    svg.rect(102, 360, 134, 104, fill=theme.blue_soft, radius=12)
    svg.circle(206, 382, 13, fill=theme.amber)
    svg.path(
        "M102 444 L141 404 L169 430 L194 401 L236 444 Z",
        fill=theme.sky,
    )
    svg.text(169, 520, "RGB image", size=28, weight=800, anchor="middle")
    svg.multiline(
        169,
        558,
        ["Decode", "Convert to RGB", "Supported formats"],
        size=19,
        color=theme.muted,
        weight=500,
        leading=1.55,
        anchor="middle",
    )
    svg.pill(92, 690, 154, "ONE INPUT", fill=theme.blue_soft, text_color=theme.sky, stroke=theme.line)

    # Step 2: identity gate and preprocessing.
    add_section_label(svg, 348, 310, "2", "Verify + prepare")
    svg.rect(348, 344, 246, 95, fill=theme.card_alt, stroke=theme.amber, radius=16, stroke_width=2.5)
    svg.text(366, 373, "CHECKPOINT GATE", size=15, color=theme.amber, weight=800, letter_spacing=1.3)
    svg.text(366, 405, "size + SHA-256 × 4", size=23, weight=800)
    svg.text(366, 428, "before deserialization", size=15, color=theme.muted)
    svg.rect(348, 466, 246, 112, fill=theme.card_alt, stroke=theme.line, radius=16)
    svg.pill(366, 482, 92, "CLIP", fill=theme.blue, text_color="#FFFFFF", height=30, size=14)
    svg.text(366, 538, "224 × 224", size=24, weight=800)
    svg.text(366, 563, "bicubic • center crop", size=15, color=theme.muted)
    svg.rect(348, 600, 246, 112, fill=theme.card_alt, stroke=theme.line, radius=16)
    svg.pill(366, 616, 104, "SIGLIP", fill=theme.sky, text_color="#07111F", height=30, size=14)
    svg.text(366, 672, "384 × 384", size=24, weight=800)
    svg.text(366, 697, "bicubic • center crop", size=15, color=theme.muted)

    # Step 3: four experts.
    add_section_label(svg, 690, 310, "3", "Four experts")
    expert_rows = [
        ("E1", "CLIP ViT-L/14", "768 → 256 → 2", theme.blue),
        ("E2", "CLIP ViT-L/14", "768 → 256 → 2", theme.blue),
        ("E3", "SigLIP So400M", "1152 → 256 → 2", theme.sky),
        ("E4", "SigLIP So400M", "1152 → 256 → 2", theme.sky),
    ]
    for index, (expert, model, head, color) in enumerate(expert_rows):
        row_y = 344 + index * 92
        svg.rect(690, row_y, 256, 76, fill=theme.card_alt, stroke=theme.line, radius=14)
        svg.circle(720, row_y + 38, 19, fill=color)
        svg.text(720, row_y + 44, expert, size=14, color="#FFFFFF" if color == theme.blue else "#07111F", weight=800, anchor="middle")
        svg.text(750, row_y + 31, model, size=18, weight=800)
        svg.text(750, row_y + 56, head, size=15, color=theme.muted, weight=600)
    svg.pill(706, 724, 224, "SOFTMAX → CLASS 1", fill=theme.blue_soft, text_color=theme.sky, stroke=theme.line, height=30, size=13)

    # Step 4: exact mean.
    add_section_label(svg, 1042, 310, "4", "Fuse")
    svg.multiline(1125, 382, ["P3 + P4", "+ P1 + P2"], size=28, weight=800, leading=1.18, anchor="middle")
    svg.line(1058, 458, 1192, 458, color=theme.sky, width=3)
    svg.text(1125, 502, "4", size=34, weight=800, anchor="middle")
    svg.pill(1044, 548, 162, "EQUAL MEAN", fill=theme.blue, text_color="#FFFFFF", height=38, size=14)
    svg.multiline(1125, 630, ["No gating", "No learned weights", "No TTA"], size=18, color=theme.muted, leading=1.55, anchor="middle")

    # Step 5: output score and artifacts.
    add_section_label(svg, 1304, 310, "5", "Output")
    svg.text(1377, 388, "0 → 1", size=40, color=theme.sky, weight=800, anchor="middle")
    svg.text(1377, 423, "continuous score", size=17, color=theme.muted, weight=600, anchor="middle")
    svg.rect(1304, 464, 146, 82, fill=theme.card_alt, stroke=theme.line, radius=14)
    svg.text(1377, 495, "API", size=16, color=theme.sky, weight=800, anchor="middle")
    svg.text(1377, 525, "single image", size=16, weight=600, anchor="middle")
    svg.rect(1304, 566, 146, 128, fill=theme.card_alt, stroke=theme.line, radius=14)
    svg.text(1377, 596, "CLI", size=16, color=theme.sky, weight=800, anchor="middle")
    svg.multiline(1377, 626, ["CSV", "JSON", "metadata"], size=16, weight=600, leading=1.35, anchor="middle")
    svg.pill(1307, 718, 140, "PROVENANCE", fill=theme.blue_soft, text_color=theme.sky, stroke=theme.line, height=30, size=12)

    # Flow arrows.
    for start, end in ((274, 326), (616, 668), (968, 1020), (1230, 1282)):
        svg.line(start + 8, 516, end - 12, 516, color=theme.sky, width=4, arrow=True)

    # Keep the decision layer visually separate from the score path.
    svg.rect(64, 808, 1408, 122, fill=theme.card_alt, stroke=theme.amber, radius=22, stroke_width=2.5)
    svg.pill(88, 834, 192, "DOWNSTREAM POLICY", fill=theme.amber, text_color="#111827", height=34, size=14)
    svg.text(308, 860, "Score first. Threshold second.", size=28, weight=800)
    svg.text(308, 896, "A threshold changes a decision boundary—not the model score or ranking.", size=19, color=theme.muted)
    svg.pill(1182, 834, 120, "0.50000", fill=theme.card, text_color=theme.text, stroke=theme.line, height=42, size=16)
    svg.text(1318, 862, "or", size=17, color=theme.muted, weight=700)
    svg.pill(1354, 834, 94, "0.28747", fill=theme.blue, text_color="#FFFFFF", height=42, size=15)
    add_footer(svg, "Source: infer/architecture.py • preprocessing.py • checkpoints.py • outputs.py")
    return svg.finish()


def build_ensemble_anatomy(theme: Theme) -> str:
    svg = Svg(
        theme,
        "SynthFlag four-expert ensemble anatomy",
        "Two CLIP experts at 224 pixels and two SigLIP experts at 384 pixels, each with binary heads, produce four class-index-1 softmax probabilities averaged in the exact released order.",
    )
    add_brand_header(
        svg,
        "Four-expert ensemble anatomy",
        "Diversity by backbone. Simplicity at fusion.",
        "Four independent checkpoint-backed experts contribute one vote each—no expert gets a hidden weight.",
    )

    # Family containers.
    svg.rect(64, 266, 680, 418, stroke=theme.blue, stroke_width=2.5, shadow=True)
    svg.rect(792, 266, 680, 418, stroke=theme.sky, stroke_width=2.5, shadow=True)

    svg.pill(88, 292, 192, "CLIP FAMILY • 224 PX", fill=theme.blue, text_color="#FFFFFF", height=40, size=15)
    svg.text(88, 372, "ViT-L/14 vision encoder", size=29, weight=800)
    svg.text(88, 405, "24 layers • 16 heads • 14 px patches", size=17, color=theme.muted, weight=500)

    svg.pill(816, 292, 240, "SIGLIP FAMILY • 384 PX", fill=theme.sky, text_color="#07111F", height=40, size=15)
    svg.text(816, 372, "So400M Patch14-384 encoder", size=29, weight=800)
    svg.text(816, 405, "27 layers • 16 heads • 14 px patches", size=17, color=theme.muted, weight=500)

    def expert_card(x: int, y: int, expert: str, color: str, width: str, probability: str) -> None:
        svg.rect(x, y, 298, 194, fill=theme.card_alt, stroke=theme.line, radius=18)
        svg.circle(x + 38, y + 39, 22, fill=color)
        svg.text(x + 38, y + 46, expert, size=15, color="#FFFFFF" if color == theme.blue else "#07111F", weight=800, anchor="middle")
        svg.text(x + 74, y + 43, "independent expert", size=18, weight=800)
        svg.text(x + 24, y + 90, width, size=30, color=color, weight=800)
        svg.text(x + 24, y + 120, "Linear • ReLU • Dropout 0.3 • Linear", size=14, color=theme.muted, weight=600)
        svg.pill(x + 24, y + 145, 250, probability, fill=theme.card, text_color=theme.text, stroke=theme.line, height=30, size=13)

    expert_card(88, 446, "E1", theme.blue, "768 → 256 → 2", "softmax(logits)[:, 1] = P1")
    expert_card(422, 446, "E2", theme.blue, "768 → 256 → 2", "softmax(logits)[:, 1] = P2")
    expert_card(816, 446, "E3", theme.sky, "1152 → 256 → 2", "softmax(logits)[:, 1] = P3")
    expert_card(1150, 446, "E4", theme.sky, "1152 → 256 → 2", "softmax(logits)[:, 1] = P4")

    # Arrows from every expert into the fusion register.
    for source_x, elbow_x in ((237, 278), (571, 532), (965, 1004), (1299, 1258)):
        svg.path(
            f"M{source_x} 640 L{source_x} 714 L{elbow_x} 714 L{elbow_x} 744",
            stroke=theme.sky,
            width=3,
            arrow=True,
        )

    svg.rect(196, 744, 1144, 174, fill=theme.card, stroke=theme.blue, radius=24, stroke_width=3, shadow=True)
    svg.pill(226, 770, 198, "EXACT FUSION", fill=theme.blue, text_color="#FFFFFF", height=36, size=14)
    svg.text(460, 804, "P(AI-generated) =", size=25, weight=800)
    svg.text(735, 804, "(P3 + P4 + P1 + P2) / 4", size=35, color=theme.sky, weight=800)
    svg.text(226, 858, "The addition order is preserved for numerical parity.", size=18, color=theme.muted, weight=500)
    svg.pill(896, 840, 126, "NO GATING", fill=theme.card_alt, text_color=theme.text, stroke=theme.line, height=34, size=12)
    svg.pill(1034, 840, 154, "NO LEARNED WEIGHTS", fill=theme.card_alt, text_color=theme.text, stroke=theme.line, height=34, size=12)
    svg.pill(1200, 840, 110, "NO TTA", fill=theme.card_alt, text_color=theme.text, stroke=theme.line, height=34, size=12)
    add_footer(svg, "Source: infer/architecture.py • FeatDistill-compatible checkpoint topology")
    return svg.finish()


def build_decision_register(theme: Theme) -> str:
    svg = Svg(
        theme,
        "SynthFlag model decision register",
        "Four evidence-labeled decisions: keep equal-mean fusion, adopt an independently selected threshold, reject learned disagreement fusion after three leave-one-dataset-out failures, and block V3 without the exact organizer dataset.",
    )
    add_brand_header(
        svg,
        "Model decision register",
        "What shipped—and what the evidence stopped.",
        "Each decision carries its evidence boundary so a promising experiment cannot quietly become a production claim.",
    )

    cards = [
        (64, 266, "01", "KEPT", "Transparent equal mean", theme.green),
        (784, 266, "02", "ADOPTED", "Threshold as deployment policy", theme.blue),
        (64, 568, "03", "REJECTED", "Learned disagreement fusion", theme.red),
        (784, 568, "04", "BLOCKED", "V3 performance evidence", theme.amber),
    ]
    for x, y, number, state, title, color in cards:
        svg.rect(x, y, 688, 264, stroke=color, stroke_width=2.5, shadow=True)
        svg.circle(x + 44, y + 46, 24, fill=color)
        svg.text(x + 44, y + 53, number, size=15, color="#FFFFFF" if color != theme.amber else "#111827", weight=800, anchor="middle")
        svg.pill(x + 84, y + 27, 136, state, fill=color, text_color="#FFFFFF" if color != theme.amber else "#111827", height=38, size=14)
        svg.text(x + 28, y + 114, title, size=29, weight=800)

    # Kept.
    svg.text(92, 424, "(P3 + P4 + P1 + P2) / 4", size=28, color=theme.green, weight=800)
    svg.multiline(92, 464, ["Auditable • stable across domains", "No learned gate or hidden expert weights"], size=17, color=theme.muted, leading=1.5)

    # Adopted.
    svg.multiline(812, 416, ["Continuous model score", "↓", "independently selected operating point"], size=19, color=theme.muted, weight=600, leading=1.32)
    svg.pill(1176, 404, 246, "0.2874746155", fill=theme.blue_soft, text_color=theme.sky if theme.name == "dark" else theme.blue, stroke=theme.line, height=48, size=19)
    svg.text(812, 500, "Same model; policy changes downstream decisions.", size=17, weight=700)

    # Rejected.
    svg.text(92, 718, "Pooled AUC: 0.8661 → 0.8752", size=22, color=theme.red, weight=800)
    svg.text(92, 754, "But every held-out dataset lost:", size=17, color=theme.muted, weight=600)
    lodo = [("CIFAKE", "−0.0614"), ("SID_Set", "−0.2198"), ("WildFake", "−0.0842")]
    for index, (dataset, loss) in enumerate(lodo):
        x = 92 + index * 196
        svg.rect(x, 780, 178, 48, fill=theme.card_alt, stroke=theme.line, radius=12)
        svg.text(x + 14, 810, dataset, size=14, weight=700)
        svg.text(x + 164, 810, loss, size=14, color=theme.red, weight=800, anchor="end")

    # Blocked.
    svg.text(812, 718, "Exact organizer DALL-E Advanced set", size=22, color=theme.amber, weight=800)
    svg.text(812, 752, "8,843 required fake images are absent.", size=18, color=theme.muted, weight=600)
    svg.rect(812, 780, 612, 48, fill=theme.card_alt, stroke=theme.amber, radius=12)
    svg.text(836, 810, "V3 metric", size=15, weight=800)
    svg.text(1398, 810, "—  unavailable", size=17, color=theme.amber, weight=800, anchor="end")

    svg.rect(64, 866, 1408, 70, fill=theme.card_alt, stroke=theme.line, radius=18)
    svg.text(92, 909, "Evidence rule", size=17, color=theme.sky, weight=800)
    svg.text(226, 909, "A pooled gain is not a production win when domain-transfer guardrails fail.", size=21, weight=700)
    add_footer(svg, "Source: submission/BENCHMARKS.md • protected V1, retrospective V2, blocked V3")
    return svg.finish()


def build_threshold_tradeoff(theme: Theme) -> str:
    svg = Svg(
        theme,
        "SynthFlag threshold tradeoff",
        "A protected-final comparison of thresholds 0.5 and 0.2874746155 showing higher balanced accuracy and fake recall, lower precision, and unchanged ROC-AUC for the same model scores.",
    )
    add_brand_header(
        svg,
        "Threshold tradeoff",
        "Same ranking. Different operating point.",
        "Protected final evidence on 7,998 images • threshold selected on calibration data, then frozen.",
    )

    # Threshold columns.
    svg.rect(64, 270, 566, 470, stroke=theme.line, shadow=True)
    svg.rect(906, 270, 566, 470, stroke=theme.blue, stroke_width=3, shadow=True)
    svg.pill(92, 296, 220, "DEFAULT THRESHOLD", fill=theme.card_alt, text_color=theme.muted, stroke=theme.line, height=38, size=14)
    svg.text(92, 376, "0.5", size=64, weight=800)
    svg.text(92, 414, "fake if score ≥ 0.5", size=19, color=theme.muted, weight=600)
    svg.pill(934, 296, 256, "BALANCED OPERATING POINT", fill=theme.blue, text_color="#FFFFFF", height=38, size=14)
    svg.text(934, 376, "0.2874746155", size=52, color=theme.sky, weight=800)
    svg.text(934, 414, "fake if score ≥ 0.2874746155", size=19, color=theme.muted, weight=600)

    metrics = [
        ("Balanced accuracy", "0.7763", "0.8061", "+0.0298", theme.green),
        ("Fake recall", "0.5924", "0.7127", "+0.1203", theme.green),
        ("Precision", "0.9371", "0.8764", "−0.0607", theme.red),
    ]
    for index, (label, left, right, delta, color) in enumerate(metrics):
        y = 472 + index * 78
        svg.text(92, y, label, size=18, color=theme.muted, weight=700)
        svg.text(594, y, left, size=26, weight=800, anchor="end")
        svg.text(934, y, label, size=18, color=theme.muted, weight=700)
        svg.text(1436, y, right, size=26, color=color, weight=800, anchor="end")
        svg.line(92, y + 25, 594, y + 25, color=theme.line, width=1.5)
        svg.line(934, y + 25, 1436, y + 25, color=theme.line, width=1.5)
        svg.pill(694, y - 28, 148, delta, fill=theme.card_alt, text_color=color, stroke=color, height=44, size=18)
        svg.line(642, y - 6, 682, y - 6, color=theme.sky, width=3, arrow=True)
        svg.line(854, y - 6, 894, y - 6, color=theme.sky, width=3, arrow=True)

    # Unchanged rank metric.
    svg.rect(152, 774, 1232, 104, fill=theme.card_alt, stroke=theme.sky, radius=22, stroke_width=2.5)
    svg.text(188, 816, "ROC-AUC", size=18, color=theme.sky, weight=800, letter_spacing=1.2)
    svg.text(188, 854, "0.8505", size=34, weight=800)
    svg.line(358, 826, 478, 826, color=theme.sky, width=4, arrow=True)
    svg.text(520, 836, "0.8505", size=34, weight=800)
    svg.text(704, 836, "UNCHANGED", size=19, color=theme.green, weight=800, letter_spacing=1.4)
    svg.text(1018, 824, "same scores", size=17, color=theme.muted, weight=600)
    svg.text(1018, 850, "same ranking", size=17, color=theme.muted, weight=600)
    svg.circle(1308, 826, 24, fill=theme.green)
    svg.path("M1296 826 L1305 835 L1322 815", stroke="#FFFFFF", width=4)

    svg.rect(270, 904, 996, 50, fill=theme.blue, radius=25)
    svg.text(768, 937, "same model and ranking; different operating point", size=22, color="#FFFFFF", weight=800, anchor="middle")
    add_footer(svg, "Source: submission/evidence/final_report.json • rounded to four decimals")
    return svg.finish()


BUILDERS = {
    "06-system-architecture": build_system_architecture,
    "07-ensemble-anatomy": build_ensemble_anatomy,
    "08-decision-register": build_decision_register,
    "09-threshold-tradeoff": build_threshold_tradeoff,
}


def main() -> int:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for stem, builder in BUILDERS.items():
        for theme_name, theme in THEMES.items():
            destination = OUTPUT / f"{stem}-{theme_name}.svg"
            destination.write_text(builder(theme), encoding="utf-8")
            print(destination.relative_to(ROOT))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

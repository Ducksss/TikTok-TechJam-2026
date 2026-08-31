# NTIRE 2026 challenge report snapshot

This directory vendors a versioned copy of the report used to explain and
attribute the FeatDistill/UESTC method. It is included so teammates and AI tools
can inspect the primary source without depending on a live browser session.

## Included files

- [`report.html`](report.html): complete arXiv HTML snapshot, including MathML,
  citations, tables, and the document's original section anchors.
- [`report.txt`](report.txt): prompt-friendly extraction of the `<article>`
  content; presentation scripts, styles, and arXiv page chrome are omitted.
- `2604.11487v1/`: the nine external figure files referenced by the HTML.
- [`source.json`](source.json): machine-readable provenance and integrity data.
- [`SHA256SUMS`](SHA256SUMS): hashes for every vendored source artifact.

The HTML keeps arXiv's original relative figure paths. Its absolute arXiv
styles/scripts are not mirrored because they are not needed for source review
or prompting. Use the live source for arXiv's complete reading interface.

## Attribution and license

- **Work:** “NTIRE 2026 Challenge on Robust AI-Generated Image Detection in the
  Wild”
- **Authors:** Aleksandr Gushchin et al.
- **Version:** arXiv:2604.11487v1, 13 April 2026
- **Source:** <https://arxiv.org/html/2604.11487v1>
- **License:** [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)

The source page declares CC BY 4.0. The HTML and figure files are preserved as
downloaded on 31 August 2026. The plain-text file is a modified representation:
it removes page chrome, scripts, styling, and markup while retaining article
text, headings, table cells, figure alternative text, and mathematical
`alttext`. No endorsement by the authors or arXiv is implied.

This third-party report is not relicensed under the repository's Apache License
2.0. Retain this attribution and the CC BY 4.0 notice when redistributing it.

## Citation

```bibtex
@inproceedings{gushchin2026ntire,
  title     = {NTIRE 2026 Challenge on Robust AI-Generated Image Detection in the Wild},
  author    = {Gushchin, Aleksandr and others},
  booktitle = {Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition Workshops},
  pages     = {1895--1913},
  year      = {2026}
}
```

## Refreshing the text extraction

The checked-in snapshot is intentionally version-pinned. To regenerate only
the prompt-friendly text from the checked-in HTML:

```bash
python scripts/extract_arxiv_html.py \
  docs/references/ntire-2026-report/report.html \
  docs/references/ntire-2026-report/report.txt
```

Do not silently replace `v1` with a later paper version. Add a new versioned
snapshot or document and review the differences first.

Verify this snapshot together with the FeatDistill snapshot using
`python scripts/verify_reference_snapshots.py` from the repository root.

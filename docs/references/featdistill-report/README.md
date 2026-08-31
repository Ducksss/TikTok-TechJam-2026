# FeatDistill technical report snapshot

This directory vendors the versioned primary technical report for the
FeatDistill detector that SynthFlag integrates. Use it for method details,
training equations, degradation strategy, and the paper's experiment narrative.
Use the separate NTIRE challenge report for organizer context, other teams, and
official challenge leaderboard results.

## Included files

- [`report.html`](report.html): complete arXiv HTML snapshot with original
  section anchors, equations, tables, citations, and MathML.
- [`report.txt`](report.txt): prompt-friendly extraction of the `<article>`
  content without arXiv page chrome, scripts, styles, or HTML markup.
- `2603.21939v1/`: the two external figures referenced by the paper HTML.
- [`source.json`](source.json): machine-readable provenance and integrity data.
- [`SHA256SUMS`](SHA256SUMS): hashes for every vendored source artifact.

The HTML retains the source's relative figure paths. ArXiv's absolute interface
styles and scripts are not mirrored because they are not needed for prompting
or primary-source review.

## Attribution and license

- **Work:** “FeatDistill: A Feature Distillation Enhanced Multi-Expert Ensemble
  Framework for Robust AI-generated Image Detection”
- **Authors:** Zhilin Tu, Kemou Li, Fengpeng Li, Jianwei Fei, Jiamin Zhang, and
  Haiwei Wu
- **Version:** arXiv:2603.21939v1, 23 March 2026
- **Source:** <https://arxiv.org/html/2603.21939v1>
- **License:** [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)

The source page declares CC BY 4.0. The HTML and figure files are preserved as
downloaded on 31 August 2026. The plain-text file is a modified representation:
it removes page chrome, scripts, styling, and markup while retaining article
text, headings, table cells, figure alternative text, and mathematical
`alttext`. No endorsement by the authors or arXiv is implied.

This third-party report is not relicensed under the repository's Apache License
2.0. Retain this attribution and the CC BY 4.0 notice when redistributing it.

## Recommended anchors

- [Architecture overview](report.html#S4.SS1)
- [Two-stage training with dense supervision](report.html#S4.SS3)
- [Multi-expert ensemble inference](report.html#S4.SS4)
- [Training perspective and equations](report.html#S4.SS7)
- [Performance analysis](report.html#S5.SS2)

## Refreshing the text extraction

```bash
python scripts/extract_arxiv_html.py \
  docs/references/featdistill-report/report.html \
  docs/references/featdistill-report/report.txt
```

The snapshot is version-pinned. Do not silently replace `v1` with a later
version; add a new reviewed version or document the differences.

Verify this snapshot together with the NTIRE snapshot using
`python scripts/verify_reference_snapshots.py` from the repository root.

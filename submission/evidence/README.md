# SynthFlag evidence map

This directory contains multiple generations of evidence. Their status is
part of the data contract:

| Artifact | Runtime measured | Status |
|---|---|---|
| `test1/` | Selected frozen Expert 4 plus three routed residual heads | Current public-development evidence |
| `INTERIM_EXPERIMENT_REPORT.md`, `final_report.json` | Retired four-expert probability mean | Historical V1 evidence only |
| `EXPERIMENT_V2_REPORT.md`, `v2_protocol.json` | Retired four-expert mean and experimental fusions | Historical retrospective V2 evidence only |
| `v3_coco_audit.json` | Prerequisite audit for the retired V3 plan | Blocked; no V3 performance result |
| `weights-manifest.json` | Retired four-expert checkpoint set | Historical identity record |

Words such as “released,” “production,” or “default” inside the V1/V2 reports
describe the repository state at the time those reports were written. They do
not describe the selected TEST1 graph. Current behavior is defined by
`training_eval/` and the `infer/` adapter; current metrics are summarized in
`test1/` and `../BENCHMARKS.md`.

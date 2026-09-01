# Historical architecture atlas

All 18 SVG files in this directory document the retired V1/V2 four-expert
runtime or its surrounding product surfaces. They are retained for audit and
design history only, and every SVG carries a visible **HISTORICAL BASELINE —
NOT SELECTED TEST1** stamp.

Do not use these files to explain the current detector. The selected source of
truth is:

- [`../../../submission/ARCHITECTURE.svg`](../../../submission/ARCHITECTURE.svg)
  for the current graph;
- [`../../../training_eval/scripts/model.py`](../../../training_eval/scripts/model.py)
  for the three residual heads; and
- [`../../../training_eval/configs/selected_test1.yaml`](../../../training_eval/configs/selected_test1.yaml)
  for native-size routing, head blend, alpha, and boundary.

The current graph has one frozen upstream Expert 4 representation plus three
project-trained residual heads. The public Journey uses the mirrored
`/selected-test1-architecture.svg`, which must remain byte-identical to the
submission diagram.

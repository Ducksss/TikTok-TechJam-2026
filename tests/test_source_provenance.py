from __future__ import annotations

import unittest

from scripts.check_source_provenance import find_identical_upstream_files


class SourceProvenanceTest(unittest.TestCase):
    def test_current_tree_has_no_prohibited_exact_upstream_files(self) -> None:
        self.assertEqual(find_identical_upstream_files(), [])


if __name__ == "__main__":
    unittest.main()

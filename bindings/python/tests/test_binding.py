from unittest import TestCase

import tree_sitter_tcss

from tree_sitter import Language, Parser


class TestLanguage(TestCase):
    def test_can_load_grammar(self):
        try:
            Parser(Language(tree_sitter_tcss.language()))
        except Exception:
            self.fail("Error loading TCSS grammar")

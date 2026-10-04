"""Regression tests for the site tooling added in the 2026-10-04 audit remediation.

    python -m unittest discover -s _pythonscripts -p "test_*.py"

Needs the importer's dependencies (academic / ruamel.yaml) and, for the roster
test, pandas + openpyxl.
"""
from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import check_site                      # noqa: E402
import import_publications as imp      # noqa: E402


class AuthorIdentity(unittest.TestCase):
    def test_owner_spellings_become_me(self):
        with tempfile.TemporaryDirectory() as tmp:
            src, dst = Path(tmp, "in.bib"), Path(tmp, "out.bib")
            src.write_text("author = {Md Gaffar and SM Choudhury and Anindya Kishore Choudhury "
                           "and Sajid Muhaimin Choudhury}", encoding="utf-8")
            imp.personalise_bib(src, dst)
            self.assertEqual(dst.read_text(encoding="utf-8"),
                             "author = {Md Gaffar and me and Anindya Kishore Choudhury and me}")

    def test_aliases_map_to_one_identity(self):
        self.assertEqual(imp.canonical_author(" Purbayan Das "), "0421062341-purbayan-das")
        self.assertEqual(imp.canonical_author("MA Matin"), "Md. Abdul Matin")
        self.assertEqual(imp.canonical_author("Andrea Alu"), "Andrea Alù")
        self.assertEqual(imp.canonical_author("Alexander V Kildishev"), "Alexander V. Kildishev")
        self.assertEqual(imp.canonical_author("Someone New"), "Someone New")
        self.assertEqual(imp.canonical_author("me"), "me")

    def test_unmapped_names_stay_as_printed(self):
        self.assertEqual(imp.canonical_author("Tanvir Ahmed"), "Tanvir Ahmed")
        self.assertNotIn("_not_mapped", imp.AUTHOR_ALIASES.values())

    def test_profile_slugs_exist(self):
        authors = Path(imp.REPO_ROOT, "data", "authors")
        for canonical in set(imp.AUTHOR_ALIASES.values()):
            if canonical[:1].isdigit() or canonical.startswith("a-"):
                self.assertTrue((authors / f"{canonical}.yaml").is_file(), canonical)


class ImporterOutput(unittest.TestCase):
    def test_url_pdf_becomes_link(self):
        fm = {"title": "x", "url_pdf": "https://example.org/p.pdf"}
        self.assertTrue(imp.modernise_links(fm))
        self.assertEqual(fm, {"title": "x", "links": [{"type": "pdf", "url": "https://example.org/p.pdf"}]})
        self.assertFalse(imp.modernise_links(fm))

    def test_cite_bib_gets_printed_author_names_back(self):
        with tempfile.TemporaryDirectory() as tmp:
            bib = Path(tmp, "papers.bib")
            bib.write_text("@article{J002,\n    author = {Md Gaffar and SM Choudhury},\n    year = {2011}\n}\n",
                           encoding="utf-8")
            page = Path(tmp, "pub", "j-002")
            page.mkdir(parents=True)
            (page / "cite.bib").write_text("@article{J002,\n author = {Md Gaffar and me},\n year = {2011}\n}\n",
                                           encoding="utf-8")
            self.assertEqual(imp.restore_cite_bib(page.parent, imp.bib_authors(bib)), 1)
            self.assertIn("author = {Md Gaffar and SM Choudhury},", (page / "cite.bib").read_text(encoding="utf-8"))


class Checker(unittest.TestCase):
    def parse(self, html: str) -> check_site.PageParser:
        p = check_site.PageParser()
        p.feed(html)
        return p

    def test_unnamed_and_hidden_links(self):
        p = self.parse('<a href="/a/"><svg></svg></a>'
                       '<a href="/b/" aria-hidden="true" tabindex="-1"><div></div></a>'
                       '<a href="/c/"><img src="x.png" alt="C"></a>'
                       '<a href="/d/" aria-label="D"></a><a href="/e/">E</a>')
        self.assertEqual(p.unnamed_links, ["/a/"])

    def test_page_basics(self):
        p = self.parse('<html lang="bn-BD"><head><title>T</title><meta name="description" content="d">'
                       '<link rel="canonical" href="https://www.sajid.bd/x/"></head>'
                       '<body id="top"><h1>T</h1><h3 id="top">x</h3><img src="a.png"></body></html>')
        self.assertEqual((p.lang, p.title, p.description), ("bn-BD", "T", "d"))
        self.assertEqual(p.headings, [1, 3])
        self.assertEqual(p.ids.count("top"), 2)
        self.assertEqual(p.images_without_alt, ["a.png"])

    def test_resolve(self):
        pub = Path("/site")
        self.assertIsNone(check_site.resolve(pub, "/x/", "https://example.org/"))
        self.assertIsNone(check_site.resolve(pub, "/x/", "mailto:a@b.c"))
        self.assertEqual(check_site.resolve(pub, "/x/", "https://www.sajid.bd/y/"), pub / "y" / "index.html")
        self.assertEqual(check_site.resolve(pub, "/x/", "files/a.dat"), pub / "x" / "files" / "a.dat")


class RosterAliases(unittest.TestCase):
    def test_hugo_urlize(self):
        try:
            import sync_authors
        except SystemExit:
            self.skipTest("pandas/openpyxl not installed")
        self.assertEqual(sync_authors.hugo_urlize("Md. Mahfuzul Haque"), "md.-mahfuzul-haque")
        self.assertEqual(sync_authors.hugo_urlize("Andrea Alù"), "andrea-alu")
        urls = sync_authors.load_alias_urls(Path(imp.REPO_ROOT, "data", "author_aliases.yaml"))
        self.assertIn("/authors/purbayan-das/", urls["0421062341-purbayan-das"])
        self.assertNotIn("_not_mapped", urls)


if __name__ == "__main__":
    unittest.main()

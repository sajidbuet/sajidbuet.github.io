#!/usr/bin/env python3
"""Integrity checks for sajid.bd: the content sources and the built site.

Replaces the one-off crawl used for the 2026-10-04 site audit
(docs/site-audit-2026-10-04.md) with checks that run on every build.

Source checks (content/, data/, config/):
  * the two language content roots are not nested
  * publication authors use canonical identities (data/author_aliases.yaml):
    no listed spelling, no spelling of the owner other than `me`, and no
    lab member listed by name instead of profile slug
  * no Bengali publication without an English original (stale copies)
  * no demo "partners" from the HugoBlox template
  * no machine-copy / backup files (*-SAJID-PC.*, *.md1, *.html1, ...)
  * no deprecated `url_pdf`

Output checks (public/, after `hugo`):
  * internal links, images and srcset candidates resolve to a built file
  * <html lang>, <title>, meta description, canonical; exactly one <h1>
  * unique id attributes; <img> has alt; links have an accessible name;
    heading levels do not skip (h2 -> h4)
  * no meta description shared by more than --max-shared-description pages
  * no machine-copy pages
  * with --build-log: no "Duplicate target paths" in the Hugo output

Usage
-----
    hugo --gc --minify --printPathWarnings > build.log
    python _pythonscripts/check_site.py --public public --build-log build.log
    python _pythonscripts/check_site.py --sources-only

Exits 1 if any error is found. Warnings are printed but do not fail.
Standard library + PyYAML only. External links are not checked here.
"""
from __future__ import annotations

import argparse
import posixpath
import re
import sys
from collections import Counter, defaultdict
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

try:
    import yaml
except ImportError:
    sys.exit("❌ PyYAML missing: python -m pip install pyyaml")

REPO = Path(__file__).resolve().parent.parent
SITE_HOSTS = {"www.sajid.bd", "sajid.bd"}

# Spellings of the owner that must have become `me` (keep in step with
# OWNER_NAMES in import_publications.py).
OWNER_SPELLINGS = re.compile(
    r"^(sajid muhaimin choudhury|choudhury, sajid muhaimin|sajid choudhury|"
    r"s\. ?m\. choudhury|sm choudhury)$", re.I)
DEMO_PARTNERS = re.compile(
    r"placeholder-logo|Become a Partner|Stanford Research Collaboration|"
    r"Google Research|National Science Foundation|Microsoft Research|"
    r"National Institutes of Health")
MACHINE_COPY = re.compile(r"(-SAJID-PC\b|-Sajid-Asus-Laptop\b|\.(md1|html1|tmp)$|-BAK\.)", re.I)


class Report:
    def __init__(self) -> None:
        self.errors: dict[str, list[str]] = defaultdict(list)
        self.warnings: dict[str, list[str]] = defaultdict(list)

    def error(self, check: str, msg: str) -> None:
        self.errors[check].append(msg)

    def warn(self, check: str, msg: str) -> None:
        self.warnings[check].append(msg)

    def print(self, limit: int) -> None:
        for title, group, icon in (("ERRORS", self.errors, "❌"), ("WARNINGS", self.warnings, "⚠️ ")):
            if not group:
                continue
            print(f"\n{title}")
            for check, msgs in sorted(group.items()):
                print(f"{icon} {check}: {len(msgs)}")
                for m in msgs[:limit]:
                    print(f"     {m}")
                if len(msgs) > limit:
                    print(f"     … {len(msgs) - limit} more")
        n_err = sum(map(len, self.errors.values()))
        n_warn = sum(map(len, self.warnings.values()))
        print(f"\n{'❌' if n_err else '✅'} {n_err} error(s), {n_warn} warning(s)")


# -----------------------------------------------------------------------------
# Source checks
# -----------------------------------------------------------------------------

def front_matter(path: Path) -> dict:
    text = path.read_text(encoding="utf-8-sig")
    if not text.startswith("---"):
        return {}
    end = text.find("\n---", 3)
    try:
        return yaml.safe_load(text[3:end]) or {} if end > 0 else {}
    except yaml.YAMLError:
        return {}


def content_dirs() -> dict[str, Path]:
    langs = yaml.safe_load((REPO / "config/_default/languages.yaml").read_text(encoding="utf-8")) or {}
    return {lang: REPO / cfg.get("contentDir", "content") for lang, cfg in langs.items()}


def check_sources(r: Report) -> None:
    dirs = content_dirs()
    roots = list(dirs.items())
    for a, pa in roots:
        for b, pb in roots:
            if a != b and pb.resolve().is_relative_to(pa.resolve()):
                r.error("nested content roots", f"{b} ({pb.relative_to(REPO)}) is inside {a} ({pa.relative_to(REPO)})")

    aliases = yaml.safe_load((REPO / "data/author_aliases.yaml").read_text(encoding="utf-8")) or {}
    not_mapped = {str(s).lower() for s in aliases.pop("_not_mapped", None) or []}
    aliases = {c: ss for c, ss in aliases.items() if not str(c).startswith("_")}
    spelling_to_canonical = {str(s): str(c) for c, ss in aliases.items() for s in ss or []}
    profiles = {p.stem: (yaml.safe_load(p.read_text(encoding="utf-8")) or {})
                for p in (REPO / "data/authors").glob("*.yaml") if "." not in p.stem}
    for canonical in aliases:
        if re.fullmatch(r"[a-z0-9-]+", str(canonical)) and str(canonical) not in profiles:
            r.error("author aliases", f"'{canonical}' looks like a profile slug but data/authors/{canonical}.yaml does not exist")
    profile_names = {}
    for slug, prof in profiles.items():
        if slug == "me":
            continue
        for name in {prof.get("title"), " ".join(filter(None, [(prof.get("name") or {}).get("given"), (prof.get("name") or {}).get("family")]))}:
            if name:
                profile_names[name.strip().lower()] = slug

    pubs: dict[str, set[str]] = {}
    for lang, root in dirs.items():
        pubs[lang] = set()
        for page in sorted((root / "publication").glob("*/index.md")):
            pid = page.parent.name
            pubs[lang].add(pid)
            fm = front_matter(page)
            rel = page.relative_to(REPO).as_posix()
            if "url_pdf" in fm:
                r.error("deprecated url_pdf", rel)
            for author in fm.get("authors") or []:
                a = str(author).strip()
                if OWNER_SPELLINGS.match(a):
                    r.error("owner not mapped to me", f"{rel}: '{a}'")
                elif a in spelling_to_canonical:
                    r.error("non-canonical author", f"{rel}: '{a}' -> '{spelling_to_canonical[a]}'")
                elif a.lower() in profile_names and a.lower() not in not_mapped:
                    r.error("member listed by name", f"{rel}: '{a}' should be '{profile_names[a.lower()]}' (add it to data/author_aliases.yaml)")
    if "en" in pubs:
        for lang, ids in pubs.items():
            for pid in sorted(ids - pubs["en"]):
                r.error("publication without English original", f"{lang}/publication/{pid}")

    for path in sorted((REPO / "content").rglob("*")):
        rel = path.relative_to(REPO).as_posix()
        if path.is_file() and path.suffix == ".md" and DEMO_PARTNERS.search(path.read_text(encoding="utf-8-sig")):
            r.error("template demo partners", rel)
    for top in ("content", "layouts", "assets", "data", "config", "_pythonscripts", "static", "i18n"):
        for path in (REPO / top).rglob("*"):
            if path.is_file() and MACHINE_COPY.search(path.name):
                r.error("machine-copy file", path.relative_to(REPO).as_posix())


# -----------------------------------------------------------------------------
# Output checks
# -----------------------------------------------------------------------------

VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.lang = None
        self.title = None
        self.description = None
        self.canonical = None
        self.refresh = False
        self.ids: list[str] = []
        self.headings: list[int] = []
        self.refs: list[tuple[str, str]] = []      # (attribute, url)
        self.images_without_alt: list[str] = []
        self.unnamed_links: list[str] = []
        self._in_title = False
        self._title_parts: list[str] = []
        self._links: list[dict] = []               # open <a> stack
        self._hidden_depth = 0
        self._stack: list[tuple[str, bool]] = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        hidden = a.get("aria-hidden") == "true"
        if tag not in VOID:
            self._stack.append((tag, hidden))
            if hidden:
                self._hidden_depth += 1
        if "id" in a and a["id"]:
            self.ids.append(a["id"])
        if tag == "html":
            self.lang = a.get("lang")
        elif tag == "title" and self.title is None:
            self._in_title = True
        elif tag == "meta":
            if (a.get("name") or "").lower() == "description":
                self.description = a.get("content")
            if (a.get("http-equiv") or "").lower() == "refresh":
                self.refresh = True
        elif tag == "link" and a.get("rel") == "canonical":
            self.canonical = a.get("href")
        elif re.fullmatch(r"h[1-6]", tag):
            self.headings.append(int(tag[1]))
        if tag == "a" and a.get("href") is not None:
            self.refs.append(("href", a["href"]))
            self._links.append({"href": a["href"], "name": bool((a.get("aria-label") or a.get("title") or "").strip())})
        elif tag in ("img", "source", "script", "iframe") or (tag == "link" and a.get("rel") in ("stylesheet", "icon", "preload", "modulepreload")):
            for attr in ("src", "href"):
                if a.get(attr):
                    self.refs.append((attr, a[attr]))
            if a.get("srcset"):
                for candidate in a["srcset"].split(","):
                    url = candidate.strip().split(" ")[0]
                    if url:
                        self.refs.append(("srcset", url))
        if tag == "img":
            if "alt" not in a:
                self.images_without_alt.append(a.get("src", "?"))
            elif self._links and a["alt"].strip():
                self._links[-1]["name"] = True
        if tag == "svg" and self._links and (a.get("aria-label") or "").strip():
            self._links[-1]["name"] = True

    def handle_endtag(self, tag):
        if tag == "title" and self._in_title:
            self._in_title = False
            self.title = "".join(self._title_parts).strip()
        if tag == "a" and self._links:
            link = self._links.pop()
            if not link["name"]:
                self.unnamed_links.append(link["href"])
        # pop to the matching tag (tolerates unclosed elements)
        for i in range(len(self._stack) - 1, -1, -1):
            if self._stack[i][0] == tag:
                for _, hid in self._stack[i:]:
                    if hid:
                        self._hidden_depth -= 1
                del self._stack[i:]
                break

    def handle_data(self, data):
        if self._in_title:
            self._title_parts.append(data)
        if data.strip() and self._links and not self._hidden_depth:
            for link in self._links:
                link["name"] = True


def resolve(public: Path, page_url: str, url: str) -> Path | None:
    """Map a same-site URL to the file it should be served from, or None if
    the URL is external / not a file reference."""
    parts = urlsplit(url)
    if parts.scheme in ("mailto", "tel", "javascript", "data") or url.startswith("#"):
        return None
    if parts.scheme in ("http", "https") or url.startswith("//"):
        if parts.netloc not in SITE_HOSTS:
            return None
    path = unquote(parts.path)
    if not path:
        return None
    if not path.startswith("/"):
        path = posixpath.join(posixpath.dirname(page_url), path)
    path = posixpath.normpath(path)
    target = public / path.lstrip("/")
    if path.endswith("/") or target.is_dir():
        target = target / "index.html"
    return target


def page_url_of(public: Path, file: Path) -> str:
    rel = file.relative_to(public).as_posix()
    return "/" + (rel[: -len("index.html")] if rel.endswith("index.html") else rel)


def check_output(r: Report, public: Path, max_shared: int) -> None:
    descriptions: dict[str, list[str]] = defaultdict(list)
    missing_targets: dict[str, set[str]] = defaultdict(set)
    pages = sorted(public.rglob("*.html"))
    if not pages:
        r.error("output", f"no HTML files in {public}")
        return
    for file in pages:
        url = page_url_of(public, file)
        if url.startswith(("/pagefind/",)):
            continue
        p = PageParser()
        p.feed(file.read_text(encoding="utf-8", errors="replace"))
        if p.refresh:                       # alias redirect stub
            for _, ref in p.refs:
                target = resolve(public, url, ref)
                if target and not target.exists():
                    missing_targets[ref].add(url)
            continue
        if MACHINE_COPY.search(url) or "sajid-pc" in url:
            r.error("machine-copy page", url)
        if not p.lang:
            r.error("missing lang", url)
        if not p.title:
            r.error("missing <title>", url)
        if not p.canonical:
            r.error("missing canonical", url)
        if not (p.description or "").strip():
            r.error("missing meta description", url)
        else:
            descriptions[p.description.strip()].append(url)
        h1 = p.headings.count(1)
        if h1 != 1:
            r.error("h1 count != 1", f"{url} ({h1})")
        for prev, cur in zip(p.headings, p.headings[1:]):
            if cur > prev + 1:
                r.warn("heading level skipped", f"{url} (h{prev} -> h{cur})")
                break
        for dup, n in Counter(p.ids).items():
            if n > 1:
                r.error("duplicate id", f"{url}: id=\"{dup}\" x{n}")
        for src in p.images_without_alt:
            r.error("img without alt", f"{url}: {src}")
        for href in p.unnamed_links:
            r.error("link without accessible name", f"{url}: {href}")
        for attr, ref in p.refs:
            target = resolve(public, url, ref)
            if target is not None and not target.exists():
                missing_targets[ref.split("#")[0]].add(url)
    for ref, where in sorted(missing_targets.items()):
        sample = ", ".join(sorted(where)[:3]) + (f" (+{len(where) - 3})" if len(where) > 3 else "")
        r.error("broken internal link", f"{ref}  ← {sample}")
    for desc, urls in sorted(descriptions.items(), key=lambda kv: -len(kv[1])):
        if len(urls) > max_shared:
            r.error("meta description shared", f"{len(urls)} pages: \"{desc[:70]}…\" e.g. {urls[0]}")


def check_build_log(r: Report, log: Path) -> None:
    text = log.read_text(encoding="utf-8", errors="replace")
    for line in text.splitlines():
        if "Duplicate target paths" in line:
            r.error("duplicate target paths", line.strip()[:300])
        elif re.search(r"\bERROR\b", line):
            r.error("hugo error", line.strip()[:300])


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--public", type=Path, default=REPO / "public", help="Built site (default: public)")
    ap.add_argument("--build-log", type=Path, help="Hugo build output to scan for duplicate targets")
    ap.add_argument("--sources-only", action="store_true", help="Skip the checks on public/")
    ap.add_argument("--max-shared-description", type=int, default=10,
                    help="Fail when one meta description is used by more pages than this (default 10)")
    ap.add_argument("--limit", type=int, default=15, help="Examples printed per check")
    args = ap.parse_args()

    r = Report()
    check_sources(r)
    if args.build_log:
        check_build_log(r, args.build_log)
    if not args.sources_only:
        check_output(r, args.public, args.max_shared_description)
    r.print(args.limit)
    return 1 if r.errors else 0


if __name__ == "__main__":
    sys.exit(main())

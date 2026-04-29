#!/usr/bin/env python3
"""Stitch frontmatter + body_new + appendix + references into a single HTML
suitable for conversion to DOCX via LibreOffice."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'report_combined.html'


def extract_body(path: Path) -> str:
    text = path.read_text()
    m = re.search(r'<body[^>]*>(.*)</body>', text, re.DOTALL | re.IGNORECASE)
    return m.group(1) if m else text


def extract_style(path: Path) -> str:
    text = path.read_text()
    m = re.search(r'<style[^>]*>(.*?)</style>', text, re.DOTALL | re.IGNORECASE)
    return m.group(1) if m else ''


def main() -> None:
    frontmatter = extract_body(ROOT / 'frontmatter.html')
    body = extract_body(ROOT / 'body_new.html')
    appendix = extract_body(ROOT / 'appendix.html')
    references = extract_body(ROOT / 'references.html')

    # pick the most comprehensive stylesheet as base (body_new) and merge
    style_body = extract_style(ROOT / 'body_new.html')
    style_fm = extract_style(ROOT / 'frontmatter.html')
    style_app = extract_style(ROOT / 'appendix.html')

    html = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Shifty — Complete Report</title>
<style>
{style_body}
{style_fm}
{style_app}
</style>
</head>
<body>
{frontmatter}
{body}
{appendix}
{references}
</body>
</html>
'''
    OUT.write_text(html, encoding='utf-8')
    print(f'Wrote {OUT}  ({OUT.stat().st_size} bytes)')


if __name__ == '__main__':
    main()

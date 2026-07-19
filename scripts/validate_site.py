from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
errors = []

data_path = ROOT / "data" / "strategies.json"
try:
    strategies = json.loads(data_path.read_text(encoding="utf-8"))
except Exception as exc:
    print(f"ERROR: invalid strategies.json: {exc}")
    sys.exit(1)

required = {"id", "title", "slug", "summary", "time_min", "time_max", "bestFor"}
seen_ids = set()
seen_slugs = set()

for index, strategy in enumerate(strategies, start=1):
    missing = required - strategy.keys()
    if missing:
        errors.append(f"Strategy #{index} is missing: {sorted(missing)}")
    sid = strategy.get("id")
    slug = strategy.get("slug")
    if sid in seen_ids:
        errors.append(f"Duplicate strategy id: {sid}")
    if slug in seen_slugs:
        errors.append(f"Duplicate strategy slug: {slug}")
    seen_ids.add(sid)
    seen_slugs.add(slug)
    page = ROOT / "strategies" / f"{slug}.html"
    if not page.exists():
        errors.append(f"Missing strategy page: {page.relative_to(ROOT)}")

html_files = list(ROOT.rglob("*.html"))
link_pattern = re.compile(r'href=["\']([^"\']+)["\']')
for html_file in html_files:
    text = html_file.read_text(encoding="utf-8")
    for href in link_pattern.findall(text):
        if href.startswith(("http://", "https://", "mailto:", "tel:", "#")):
            continue
        target_text = href.split("#", 1)[0].split("?", 1)[0]
        if not target_text:
            continue
        target = (html_file.parent / target_text).resolve()
        if not target.exists():
            errors.append(
                f"Broken link in {html_file.relative_to(ROOT)}: {href}"
            )

if errors:
    print("\n".join(f"ERROR: {item}" for item in errors))
    sys.exit(1)

print(f"Validated {len(strategies)} strategies and {len(html_files)} HTML pages.")

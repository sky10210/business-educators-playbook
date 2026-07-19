# The Business Educator's Playbook

A static, searchable teaching-strategy website for Business Foundations, Marketing, Personal Finance, Entrepreneurship, Economics, Sports & Entertainment Marketing, and AP Business.

## Repository structure

- `index.html`  -  searchable strategy library
- `strategies/`  -  public strategy pages
- `content/strategies/`  -  source Markdown
- `content/shared/`  -  reusable instructional components
- `data/strategies.json`  -  website strategy index
- `assets/`  -  CSS and JavaScript
- `scripts/validate_site.py`  -  repository validator
- `.github/workflows/pages.yml`  -  GitHub Pages deployment

## Run locally

```bash
python -m http.server 8000
```

Open `http://localhost:8000`.

## Validate

```bash
python scripts/validate_site.py
```

## Deploy

Upload the contents of this folder to the root of a GitHub repository and enable GitHub Pages using GitHub Actions. See `docs/GITHUB_PAGES_SETUP.md`.

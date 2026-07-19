# GitHub Pages Setup

This repository is a static website and can be deployed directly from GitHub.

## Recommended deployment

1. Create a GitHub repository.
2. Upload the contents of `business-educators-playbook-site` to the repository root.
3. Use `main` as the default branch.
4. Open **Settings → Pages**.
5. Under **Build and deployment**, select **GitHub Actions**.
6. Push a commit to `main`.

The included workflow will:

- validate `data/strategies.json`,
- reject duplicate IDs and slugs,
- confirm every strategy has a matching HTML page,
- check internal HTML links,
- deploy the repository root to GitHub Pages.

## Local preview

Run:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

Do not open `index.html` directly from the filesystem because browsers may block `fetch()` from loading the strategy JSON.

## Custom domain

After the final domain is selected:

1. Add the domain in GitHub Pages settings.
2. Add the required DNS records.
3. Add a `CNAME` file containing the exact domain.
4. Update canonical URLs, Open Graph metadata, `robots.txt`, and generate a domain-specific `sitemap.xml`.

## Validation

Run before each upload:

```bash
python scripts/validate_site.py
```

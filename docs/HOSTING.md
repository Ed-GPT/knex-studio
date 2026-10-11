# Hosting a website demo

## GitHub Pages

Public demo: https://ed-gpt.github.io/knex-studio/

Repository Settings → Pages uses **GitHub Actions**. The `Deploy demo` workflow runs syntax checks and tests on each push to `main`, packages only `dist/`, and deploys it after verification succeeds. It can also be started manually from Actions. The separate `Checks` workflow validates pull requests.

## Other static hosts

Upload the **contents of `dist/`** to a static website directory such as `/knex/`. Keep the folder hierarchy, including `vendor/`. No server API or secret is required. Serve JavaScript as JavaScript and use HTTPS on a public website.

The app uses relative asset and module URLs, so it can run at a site root or inside a subdirectory. Do not rewrite missing JavaScript files to an HTML page.

To embed an already hosted demo, replace the example path with its actual destination:

```html
<iframe
  src="/knex/"
  title="K’NEX Studio interactive demo"
  style="width:100%;height:85vh;border:0"
  allow="fullscreen"
></iframe>
```

Provide an ordinary link to open the editor in a full window as well. Cross-site embedding can restrict browser storage; same-site hosting is preferable. Saved builds do not automatically move between origins: download them with Save first.

## Repository and publication

Run `npm run check` and `npm test` before publishing. GitHub Pages deployment is automatic after a successful push to `main`; other hosts require their own deployment setup.

The existing `.openai/hosting.json` belongs to the current Sites deployment. It is not needed for an independently hosted static demo. Publish `dist/` rather than the entire workspace, development logs, or repository metadata.

The public source repository is https://github.com/Ed-GPT/knex-studio. Screenshots in `docs/screenshots/` are for the README and are not included in the deployed application.

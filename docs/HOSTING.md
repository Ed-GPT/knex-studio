# Hosting a website demo

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

Run `npm run check` and `npm test` before publishing. The included GitHub workflow runs these checks on pushes and pull requests. It does not deploy a website automatically.

The existing `.openai/hosting.json` belongs to the current Sites deployment. It is not needed for an independently hosted static demo. Publish `dist/` rather than the entire workspace, development logs, or repository metadata.

No GitHub repository or website deployment is configured by these instructions. Choose the destination and visibility during connection setup.

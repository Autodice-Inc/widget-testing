# Try Miles

A one-page app where a dealership logs in with its AutoDice account and chats with its own Miles
widget. Login goes through the AutoDice API (cookies), and the page then loads the widget whose id
is on that account.

## Run locally

Needs the API on :3000 and the widget's dev server on :4545 (`npm run dev:frame` in
`autodice/widget`). The API's `.env` must have `WIDGET_TEST_ORIGINS=localhost:5173`, or every widget
rejects this page.

```sh
yarn
yarn dev   # http://localhost:5173
```

The dev server proxies `/v1` to the API, so no CORS entry is needed locally. `API_PROXY_TARGET`
points the proxy at another API.

## Build

`yarn build` writes a static site to `dist/`. It needs both variables (it fails without them):

| Variable | Example | What it is |
| --- | --- | --- |
| `VITE_API_BASE` | `https://api.example.com/v1` | The API's base URL, `/v1` included |
| `VITE_WIDGET_LOADER` | `https://cdn.example.com/widget.js` | The widget's embed script, from the same environment as the API |

The API of that environment needs:

- the app's origin in `CORS_ORIGINS`, since login and `GET /users` are credentialed cross-origin calls;
- the app's domain in `WIDGET_TEST_ORIGINS` (comma-separated, e.g. `try.example.com`), so every
  dealership's widget accepts this page without the dealership whitelisting it;
The app has to be on the same site as the API (e.g. both subdomains of one domain): the auth
cookies are `SameSite=Strict`, so a browser won't send them from another site.

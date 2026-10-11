# TopFlex Web App

This is the browser version of the uploaded TopFlex application. It keeps the original Home, Transactions, Wallet, More, airtime, bills, food, and other service routes, with a rebuilt Buy Data flow.

## Run the app

From the workspace root:

```sh
pnpm install --filter @workspace/topflex-data-web...
pnpm --filter @workspace/topflex-data-web run dev
```

The development command exports the browser build and serves it on `PORT` (default `3000`). For a production build:

```sh
pnpm --filter @workspace/topflex-data-web run build
```

The deployable static website is written to `artifacts/topflex-data-web/dist/public`. It uses client-side routes, so a static host should send unknown paths back to `index.html`.

## Install as an app

The web build includes a standalone-app manifest and TopFlex icons. Open the secure web address in Chrome and choose **Install app** or **Add to Home screen**; on iPhone or iPad, use Safari’s **Share → Add to Home Screen**. Launching the installed app hides the browser address bar. A regular browser tab still shows its browser controls.

## Frontend-only preview

No Supabase credentials or purchase service are included in this web build. Wallet values and recent transactions are marked as test data. Buy Data lets users choose a carrier and bundle, validates the Ghana phone-number prefix, and shows a confirmation step; the final action clearly stops without taking payment or creating a transaction. Marketplace screens explain when live service data is unavailable.

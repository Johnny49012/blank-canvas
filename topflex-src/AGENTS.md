# Architecture

- This is an Expo (React Native / expo-router) app exported to web, imported from a Replit zip. It is NOT the Lovable TanStack starter — do not scaffold a web_app artifact over it.
- Preview flow: `bun run build` (expo export → dist/public) must run after source changes; `bun run dev` only serves the prebuilt dist/public via server/serve-web.mjs, because expo export is too slow for the preview daemon's startup timeout.
- server/serve-web.mjs accepts a `--port` flag (the preview daemon passes `--port 8080`); keep that parsing intact.
- The original Replit workspace package `@workspace/api-client-react` was not in the zip and is unused by the code; it was removed from package.json/tsconfig. Do not re-add it.
- Data layer: lib/topflex.ts runs in FRONTEND_ONLY_PREVIEW mode with local test data; Supabase env vars (EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY) are required for real data.
- All Services uses a single scroll view with a sticky title/search section after the toolbar so navigation icons scroll away before the service list passes beneath the search.
- Food location confirmation uses the existing local food store and returns the selected address to browsing and checkout; unavailable live-map features remain explicit rather than using a fabricated geographic map.
- Restaurant details and menus share the existing restaurant route and catalogue so View Menu preserves cart ordering without duplicate restaurant screens.
- GOtv uses a dedicated subscription screen and a separate branded help component; account verification gates renewal checkout and all unsupported account/payment/support actions remain explicit so browsing never simulates a successful service request.

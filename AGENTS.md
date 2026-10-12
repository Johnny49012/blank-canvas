<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- TopFlex web preview deploy: after `npx expo export --platform web`, copy the export to `public/topflex` and then patch it — rename `assets/node_modules` to `assets/nm` (and `@expo-google-fonts` to `assets/nm/expo-google-fonts`) with matching rewrites in the exported entry JS, and insert a `history.replaceState` script into `index.html` mapping `/index.html` to `/topflex/`. Without these the Vite dev server refuses the node_modules-shaped public paths and expo-router loses the base path.

- TopFlex editable source lives in `topflex-src/` (never /tmp, which the sandbox wipes); build there and copy the export into `public/topflex` with the documented patches.
- Keep the legacy `/index` preview URL redirected to `/` so saved preview locations still open TopFlex.
- DStv help is a dedicated screen state with a separate help component and shared palette; both help entry points use it so customers stay within the DStv experience. Support actions must report unavailable until a real support service exists.
- Restaurant review presentation uses shared public-only review selectors and the existing two-item Pager so preview rows move together; catalogue sample rating totals are not customer review records.
- Review submission remains unavailable until authenticated server-confirmed completed orders and a real review service exist; local wallet simulations must not establish review eligibility.

# YouEye Canvas

YouEye Canvas is a forkable Next.js source template for building a YouEye native application. Its public release unit is this editable repository source: fork or copy it, rename the example application, and develop your application in the resulting repository.

Canvas is not published as an npm SDK and its release is not a prebuilt server, container, appliance, or `.next/standalone` bundle. A fork may choose its own downstream build and deployment process without changing the Canvas source-release contract.

## Create an application

1. Fork this repository, or copy its tracked source into a new repository.
2. Install the pinned toolchain dependencies with `pnpm install --frozen-lockfile`.
3. Run `node scripts/rename.mjs --dry-run --id ye-tasks --name "Tasks" --repo example/Tasks`,
   then repeat without `--dry-run` to apply the rename. Review the resulting identity:
   - update `metadata.id`, names, category, icon, subdomain, and `containers[].source.repo` in `youeye-app.yaml`;
   - replace `myapp` and `ye-myapp` in `src/` with identifiers owned by your application;
   - customize `src/app/page.tsx`, application routes, navigation, data models, and presentation;
   - add only assets that you are entitled to distribute.
4. Run `pnpm test`, `pnpm validate:source`, and `pnpm build` before proposing changes.

The checked-in manifest deliberately uses `YOUR_PUBLIC_ORG/YOUR_APP_REPOSITORY` as its source-repository placeholder. A fork must replace it with the public `owner/repository` identity for that application before publishing the fork.

## Template structure

| Path | Purpose |
| --- | --- |
| `src/app/` | Example Next.js application and platform route handlers |
| `src/lib/auth/` | OAuth and signed-session helpers |
| `src/lib/api/` | Authenticated platform API client |
| `src/lib/components/` | Shared layout, navigation, and PWA components |
| `src/lib/connections/` | Runtime app-to-app connection discovery |
| `src/lib/db/` | PostgreSQL query helpers for applications that need them |
| `src/lib/embed/` | Widget, timeline, and settings embed primitives |
| `src/lib/middleware/` | Authentication middleware factory |
| `src/lib/routes/` | Health, auth, manifest, theme, settings, and integration route factories |
| `src/lib/theme/` | Platform theme synchronization |
| `youeye-app.yaml` | Application manifest template; it remains `kind: app` |

Applications own their business logic, data model and migrations, pages, application-specific components, embeds, and inter-application handlers. Canvas supplies reusable source and example wiring for platform authentication, theme, navigation, API routes, and connection discovery.

## Configuration guidance

The manifest maps install-time values into environment variables. Values such as `${secrets.jwt_secret}`, `${identity.externalUrl}`, and `${app.url}` are symbolic platform inputs, not public credentials or fixed infrastructure addresses. Do not commit resolved secrets, private hostnames, machine addresses, or operator filesystem paths.

Use `IDENTITY_URL`, `IDENTITY_INTERNAL_URL`, `IDENTITY_CLIENT_ID`,
`IDENTITY_CLIENT_SECRET`, and `APP_EXTERNAL_URL` for YouEye ID and app URLs.
The short manifest id (`tasks`) identifies the installed app; `APP_ID` in
`src/lib/app-config.ts` is the runtime/session fallback (`ye-tasks`).

Use the connection helpers in `src/lib/connections/` rather than hard-coding another application's hostname. Treat absent connections as a normal state and provide a useful setup message to the administrator.

Keep embed routes that must render outside the main application shell in the middleware's public-route list. Embed pages should use the protocol helpers in `src/lib/embed/` so the parent can observe readiness, size changes, and actions.

## Working surface and PWA examples

The manifest declares `surfaceSchemaVersion: 1`. Working examples cover
`widget`, `timeline-card`, `info-card`, `notification`, and `settings-panel`
under `src/app/embed/`. `/embed/settings` renders panel content only; the host
owns the surrounding title and navigation. Embeds emit `youeye:ready`,
`youeye:resize`, and `youeye:action` through the shared layout.

The header includes app branding, persistent UI-owned overlays, and a mobile
account sheet. The Serwist configuration compiles `src/app/sw.ts` into the ignored
`public/sw.js`; the worker includes an offline fallback and icon-cache rollover.
These are application features, not Canvas release artifacts.

Existing native apps own their local code after forking. Canvas is not an
ongoing synchronization source for their headers or application logic.

## Local development

```bash
pnpm install --frozen-lockfile
pnpm dev
```

The ordinary production compile is:

```bash
pnpm build
```

That command runs `next build`; it does not package or publish a runtime artifact. Generated `.next/` content is ignored and is never part of a Canvas source release.

## Validation and release tags

`package.json` is the only Canvas version authority. For version `X`, the only valid source-release tag is `vX`. No manifest version or separate version file is used.

```bash
pnpm test
pnpm validate:source
RELEASE_TAG="v$(node -p "require('./package.json').version")" pnpm validate:release
```

Validation is local and dependency-free. It checks the source-template identity, application-manifest kind, public documentation, forbidden private references, absence of tracked runtime output, and the release tag when release mode is selected. See [CONTRIBUTING.md](CONTRIBUTING.md) for the complete public-release gate.

## Technology

- Next.js 15 and React 19
- TypeScript
- Tailwind CSS 4
- pnpm 10.6.2

## License and trademarks

Source is licensed under the [Business Source License 1.1](LICENSE), with the change date and change license stated there. See [TRADEMARK.md](TRADEMARK.md) for trademark guidance.

## Acting user and household admission

Private routes derive the acting identity from `getSession(appId)`, which checks
the native cookie and current identity session through the configured client.
Both middleware and backend checks send the verified JWT `iat` as
`X-YouEye-Session-Issued-At` to `/identity/session/check`, alongside the
confidential client credentials and expected subject/session IDs. The provider
rejects missing or malformed times and sessions issued at or before the
client/user revocation cutoff. Restoring access requires a fresh authorization;
it does not revive an old app cookie. Update vendored app auth modules before
deploying a provider that requires this header. Never derive it from request
headers or from the current clock.
Never use a browser-supplied `X-YouEye-User`, `userId` or `user_id` to select
private rows or nominate the user of a platform service call. Household admission
and per-user service consent are separate checks; administrative status does not
grant access to every app.

Apps whose private namespaces use the validated OIDC subject should declare
`data_ownership: { per_user: identity_uuid }` in their app manifest. Control
Panel reserves immutable per-user ownership records for the installation;
the app still enforces private-row access. This declaration cannot nominate an
owner or claim platform row isolation. A recreated username has a new UUID and
must never adopt its predecessor's private namespace.

Participating back-channel logout handlers should persist the signed event
`iat` and reject cookies issued at or before that cutoff. Use the signed time,
not the delivery time: a delayed event must not invalidate a fresh authorization
after access is restored. Deduplicate by event identity and reject conflicting
replays. A later revocation of the same identity session is a separate event.
Older stored events without a signed cutoff should conservatively deny their
original session. Session checks remain required for apps without a registered
back-channel endpoint.

Widget, card and inter-app routes require a native session. Inter-app factories
receive an explicit app ID and pass `{ userId }` as the second handler argument;
user fields are removed from request data. A server-to-server caller without a
validated native session is denied. Header/body identity nomination is not a
supported delegation protocol. Existing explicitly public shares and public
content remain distinct from private routes, and external public exposure must
be chosen by the appliance administrator.

## App service credentials

Platform calls run on the server with the protected `YOUEYE_APP_ID`,
`YOUEYE_APP_TOKEN` and `YOUEYE_GATEWAY` values injected by the installer.
The app ID is the exact installed ID; helpers do not invent prefix aliases.
A missing credential fails with an integration-not-ready error. Use Market's
administrator credential reconciliation action to repair delivery.

Pass the acting user from a validated server session. Caller-supplied headers
cannot replace machine identity, select another user, or attach a browser/bridge
credential. Keep platform helpers in server code and keep runtime credentials
out of source, browser bundles and logs. Public health/manifests do not need a
service credential. Rotation and restore reinject a credential and prove it
before marking integration ready.

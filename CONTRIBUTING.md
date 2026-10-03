# Contributing and public releases

## Contribution checks

Keep changes source-focused and reviewable. Before opening a contribution:

1. Confirm the change contains no credentials, private hostnames, machine addresses, operator paths, internal repository identities, worker notes, branch history, or deployment history.
2. Keep `youeye-app.yaml` an application manifest with `kind: app`. Do not redefine Canvas as infrastructure, an appliance, or a runtime artifact.
3. Do not commit generated output such as `.next/`, `dist/`, archives, containers, or standalone server bundles.
4. Add or update dependency-free contract tests when changing the source-release rules.
5. Run:

   ```bash
   pnpm test
   pnpm validate:source
   pnpm build
   ```

Contributions must include only assets, names, and other material the contributor has authority to license for the intended distribution. Repository presence alone is not proof of redistribution or trademark rights.

## Public-release contract

A Canvas public release is the tracked, editable source template. `package.json.version` is its sole version authority. Numeric versions may have three to six positions; five-position versions support private Forgejo main releases and six-position versions represent development source. If that version is `X`, the release tag must be exactly `vX`, or `beta-vX` for a four-position GitHub beta release. GitHub main uses three positions; private Forgejo main uses five. Six-position development versions require `dev-vX` tags.

Prepare a release from a clean candidate tree and run:

```bash
RELEASE_TAG="<exact destination tag>" pnpm validate:release
pnpm test
pnpm build
```

The validator must pass without network access. Do not create another version file, copy the version into the application manifest, or use a runtime-output digest as the source-template identity.

The releaser must review the exact candidate diff and affirm all of the following before tagging or publishing:

- the source is intentionally public and contains no private operational information;
- third-party notices and license obligations have been satisfied;
- every included logo, icon, screenshot, name, trademark, and other asset is approved for this distribution, with unknown rights resolved rather than assumed;
- no generated runtime output is included;
- the release tag matches `package.json.version` exactly;
- an authorized project owner has approved the release, and legal review has approved it wherever ownership, license, trademark, privacy, or redistribution status is uncertain.

Automated validation supports this review but does not establish ownership or legal rights. Do not publish when an approval or right is unknown.

## Development version baseline

Before the next release, align each component's development version with its
latest published Stable base and choose an unused six-position development
iteration (for example, `0.5.1.0.0.1` after Stable `0.5.1`). Never lower a
component already on a newer base. A public snapshot can advance its release
version without advancing the development branch automatically; compare source
content separately from version numbers. Keep all registered version authorities
consistent. Existing release locks describe real published inputs: do not replace
their versions, tags or hashes with values for artifacts that do not exist.

Source preparation does not require a Development release. The release workflow
merges reviewed development source, assigns the destination version, then builds
and publishes only when explicitly started. Private Alpha uses five positions;
public Stable uses three. A source-only task must not create tags or releases.

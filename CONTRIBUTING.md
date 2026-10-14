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

A Canvas public release is the tracked, editable source template. `package.json.version` is its sole version authority. New versions use `X.Y.Z[-token.N]`. Stable tags are `vX`, Beta tags are
`beta-vX`, development tags are `dev-vX`, and private main tags are `vX`
with an `alpha.N` suffix. The version is independent of YouEye core.
Historical numeric-depth candidates remain readable under their frozen contract.

Prepare a release from a clean candidate tree and run:

```bash
RELEASE_TAG="<exact destination tag>" pnpm validate:release
pnpm test
pnpm build
```

The validator must pass without network access. Do not create another version file, copy the version into the application manifest, or use a runtime-output digest as the source-template identity.

Run the contract tests against the destination-version candidate as well as the
development tree. Canonical and historical version formats may report different
validation errors; tests must enforce exact tag rejection without requiring a
legacy diagnostic for a canonical release.

The releaser must review the exact candidate diff and affirm all of the following before tagging or publishing:

- the source is intentionally public and contains no private operational information;
- third-party notices and license obligations have been satisfied;
- every included logo, icon, screenshot, name, trademark, and other asset is approved for this distribution, with unknown rights resolved rather than assumed;
- no generated runtime output is included;
- the release tag matches `package.json.version` exactly;
- an authorized project owner has approved the release, and legal review has approved it wherever ownership, license, trademark, privacy, or redistribution status is uncertain.

Automated validation supports this review but does not establish ownership or legal rights. Do not publish when an approval or right is unknown.

## Release version identity

New releases use `X.Y.Z[-token.N]`, retaining all three numeric positions.
Development targets the next Stable base: after `0.5.3`, use
`0.5.4-dev.N`; private main uses `alpha.N`, public Beta uses `beta.N`, and
feature releases use a collision-checked branch token with a numeric counter.
The exact case-sensitive Git branch remains separate from the display token.
Select source/channel before comparing versions; `.10` follows `.9`.

The release coordinator reserves identities with a stable request key before
building. Retry the same frozen attempt; never repurpose a used identity or
rewrite historical tags, locks or artifact versions. Failed attempts may leave
gaps. Source-only preparation does not start builds or publication, and the
existing branch/merge workflow remains in effect.

This product retains its own version sequence; it is not numbered from the
YouEye core release group. Keep every registered source version authority
consistent. Unchanged published payloads retain their original provenance.

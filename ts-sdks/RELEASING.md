# Releasing `@mysten/sui-groups`

This repo uses [Changesets](https://github.com/changesets/changesets) for versioning and npm publishing. The `@changesets/cli` is installed as a dev dependency and available via `pnpm changeset`.

## How it works

Every PR that changes the public `@mysten/sui-groups` package should include a **changeset** — a small markdown file that describes the change and its semver impact (patch / minor / major).

When changesets are merged to `main`, a GitHub Action automatically opens a **"Version Packages"** PR that bumps versions and updates the changelog. Merging that PR triggers an automated npm publish via OIDC trusted publisher.

## Day-to-day workflow

### 1. Create a changeset with your PR

From the `ts-sdks` directory:

```bash
cd ts-sdks
pnpm changeset
```

This runs the interactive `@changesets/cli`. It will:

1. Ask which package(s) are affected
2. Ask the semver bump type (patch / minor / major)
3. Ask for a summary of the change

It creates a file in `ts-sdks/.changeset/` (e.g. `.changeset/funny-dogs-dance.md`). Commit this file with your PR.

Other useful commands:

```bash
pnpm changeset status          # see pending changesets
pnpm changeset status --verbose # see details of pending changesets
```

If your PR doesn't affect the public package (e.g. CI changes, docs), you don't need a changeset — the bot warning comment can be ignored.

### 2. Merge your PR

After review, merge to `main` as usual.

### 3. Release via the "Version Packages" PR

After merge, the `changesets.yml` workflow creates or updates a PR titled **"Version Packages"**. This PR:

- Bumps the version in `package.json` based on the changeset(s)
- Updates `CHANGELOG.md`
- Removes the consumed changeset files

**Merge it when you're ready to release.** This triggers the automated npm publish. You control release timing by choosing when to merge this PR — multiple changesets can accumulate before you release.

## First-time setup (one-time, per package)

The first npm publish must be done manually because the package doesn't exist on the registry yet:

```bash
cd ts-sdks/packages/sui-groups
pnpm build
npm login
npm publish --access public
```

After the first publish, configure the **OIDC trusted publisher** on [npmjs.com](https://www.npmjs.com):

- Package settings → Publishing access → Add trusted publisher
- Repository: `MystenLabs/sui-groups`
- Workflow: `changesets.yml`
- Environment: _(leave blank)_

## Semver guidelines

| Bump    | When to use                                             |
| ------- | ------------------------------------------------------- |
| `patch` | Bug fixes, internal refactors with no public API change |
| `minor` | New features, non-breaking additions to the public API  |
| `major` | Breaking changes to the public API                      |

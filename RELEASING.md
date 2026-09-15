# Releasing

Packages in this workspace are versioned independently with Changesets. Publishing remains a manual step.

## Repository setup

In GitHub, enable **Settings → Actions → General → Allow GitHub Actions to create and approve pull requests**. The Changesets action needs this repository permission to maintain the release pull request.

## Contributor workflow

Every pull request with a user-facing package change should include a changeset:

1. Run `pnpm changeset`.
2. Select each affected package and the appropriate semantic version bump.
3. Write a concise, user-facing summary and commit the generated file in `.changeset/` with the code change.

Use `pnpm changeset:status` to preview the package versions and changelog entries that are pending.

## Version Packages pull request

After changesets reach `main`, the release workflow opens or updates a **Version Packages** pull request. The pull request runs `pnpm version-packages`, which consumes pending changesets, updates only the affected package versions, and writes each package's `CHANGELOG.md`.

Review the versions and changelogs before merging the pull request. Merging it does not publish packages, create GitHub releases, or create tags.

## Publish and tag manually

After merging the Version Packages pull request, update your local `main`, run the workspace checks, and publish each released package from its directory:

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm typecheck
pnpm build
cd packages/<package-name>
pnpm publish --access public
```

After npm publication succeeds, create and push a package-specific tag from the release commit:

```sh
git tag <package-name>@<version>
git push origin <package-name>@<version>
```

For example, the pending autolink release will use `satteri-autolink-paragraphs@0.3.0`.

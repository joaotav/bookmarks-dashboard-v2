# Contributing

Every change starts as an issue, is made on a branch, and reaches `main` through a pull request that is squash-merged once CI passes. The process follows [Hermes](https://github.com/informalsystems/hermes/blob/master/CONTRIBUTING.md), scaled down to a small project.

- [Issues](#issues)
- [Branches and commits](#branches-and-commits)
- [Pull requests](#pull-requests)
- [Tests](#tests)
- [Changelog](#changelog)

## Issues

Open an issue before starting work, using one of the templates: bug report, feature request or tracking issue. Search the existing issues first.

Larger efforts get a tracking issue, with the smaller issues attached as sub-issues in the order they should be done. The [MVP tracking issue](https://github.com/joaotav/bookmarks-dashboard-v2/issues/1) lists the milestones in [docs/mvp-plan.md](docs/mvp-plan.md).

## Branches and commits

Branch off `main`. Branch names start with your GitHub username, followed by a short description: `joaotav/m3-display-settings`.

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/), like `feat: add display settings` or `fix: keep collapse state after undo`. Each commit does one logical thing. Commits are signed, so GitHub shows them as Verified.

## Pull requests

Each pull request:

- does one thing, which should be clear from its title, description and issue
- links its issue with `Closes #N`, so merging closes the issue
- has a title in Conventional Commits form, because the title becomes the commit subject on `main`, with GitHub adding the PR number: `feat: add display settings (#21)`
- includes tests and updates docs
- adds a [changelog](#changelog) entry when users will notice the change
- fills in the checklist from the template

Pull requests are squash-merged into `main` once CI passes. The squashed commit lists the branch's commits in its message, and the branch is deleted after merging.

Dependabot's pull requests are the exception: they have no issue and no changelog entry.

## Tests

| Command | What it runs |
|---|---|
| `npm test` | Unit and component tests (Vitest) |
| `npm run test:e2e` | Builds the Chrome extension and runs the end-to-end tests (Playwright) |
| `npm run check` | Type check, unit and component tests, `npm audit`, Firefox build and `web-ext lint` |

CI runs `npm run check` and `npm run test:e2e` on every pull request. Firefox can't be tested under automation, so check changes to the extension by hand with `npm run dev:firefox`. [docs/mvp-plan.md](docs/mvp-plan.md#testing) explains the test layers.

## Changelog

[CHANGELOG.md](CHANGELOG.md) tells users how the extension changed. It is not a list of merged pull requests; the commit history already is one. Write entries for users, not developers, and leave out changes they won't notice, like CI, tests or refactoring.

New entries go under **Unreleased**, in one of these sections: Breaking changes, Features, Improvements, Bug fixes. If a change takes several pull requests, give it one entry describing the net effect. Link the issue:

```md
- Choose a theme, density and title style in the new settings panel ([#7](https://github.com/joaotav/bookmarks-dashboard-v2/issues/7))
```

At a release, the Unreleased entries move under the new version number.

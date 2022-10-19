# RedditLattice

> A FOSS reddit viewer for image based subreddits. Lays out the images in a tight lattice.

## Development Guide

This turborepo uses [pnpm](https://pnpm.io) as a package manager. It includes the following packages/apps:

### Apps and Packages

- `web`: another [solid-start](https://solidjs.com) app
- `ui`: a stub solid-js component library shared by `web` applications
- `eslint-config-custom`: `eslint` configurations (includes `eslint-config-solid-start` and `eslint-config-prettier`)
- `tsconfig`: `tsconfig.json`s used throughout the monorepo

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

### Utilities

This turborepo has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting

### Build

To build all apps and packages, run the following command:

```
pnpm run build
```

### Develop

To develop all apps and packages, run the following command:

```
pnpm run dev
```

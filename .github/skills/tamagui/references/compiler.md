# Tamagui Compiler

Optimizing compiler that extracts styles at build time for better performance.

## Overview

The Tamagui compiler analyzes styled components and extracts static styles to CSS, reducing runtime overhead. It works with various bundlers through dedicated plugins.

## Bundler Plugins

| Plugin                | Bundler         | Docs                                                                                                       | Source                                                                            |
| --------------------- | --------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| @tamagui/vite-plugin  | Vite            | [docs](https://github.com/tamagui/tamagui/blob/main/code/tamagui.dev/data/docs/guides/vite.mdx)            | [source](https://github.com/tamagui/tamagui/tree/main/code/compiler/vite-plugin)  |
| @tamagui/next-plugin  | Next.js         | [docs](https://github.com/tamagui/tamagui/blob/main/code/tamagui.dev/data/docs/guides/next-js.mdx)         | [source](https://github.com/tamagui/tamagui/tree/main/code/compiler/next-plugin)  |
| @tamagui/metro-plugin | Metro (RN/Expo) | [docs](https://github.com/tamagui/tamagui/blob/main/code/tamagui.dev/data/docs/guides/metro.mdx)           | [source](https://github.com/tamagui/tamagui/tree/main/code/compiler/metro-plugin) |
| @tamagui/babel-plugin | Babel           | [docs](https://github.com/tamagui/tamagui/blob/main/code/tamagui.dev/data/docs/intro/compiler-install.mdx) | [source](https://github.com/tamagui/tamagui/tree/main/code/compiler/babel-plugin) |
| @tamagui/loader       | Webpack         | [docs](https://github.com/tamagui/tamagui/blob/main/code/tamagui.dev/data/docs/guides/webpack.mdx)         | [source](https://github.com/tamagui/tamagui/tree/main/code/compiler/loader)       |

## Core Compiler

| Package                | Description                    | Source                                                                             |
| ---------------------- | ------------------------------ | ---------------------------------------------------------------------------------- |
| @tamagui/static        | Static extraction engine       | [source](https://github.com/tamagui/tamagui/tree/main/code/compiler/static)        |
| @tamagui/static-worker | Worker for parallel extraction | [source](https://github.com/tamagui/tamagui/tree/main/code/compiler/static-worker) |

## Framework Setup Guides

| Framework | Description                         | Guide                                                                                              |
| --------- | ----------------------------------- | -------------------------------------------------------------------------------------------------- |
| Vite      | Web development with Vite plugin    | [docs](https://github.com/tamagui/tamagui/blob/main/code/tamagui.dev/data/docs/guides/vite.mdx)    |
| Next.js   | SSR and App Router integration      | [docs](https://github.com/tamagui/tamagui/blob/main/code/tamagui.dev/data/docs/guides/next-js.mdx) |
| Expo      | Expo managed and bare workflows     | [docs](https://github.com/tamagui/tamagui/blob/main/code/tamagui.dev/data/docs/guides/expo.mdx)    |
| Metro     | React Native bundler setup          | [docs](https://github.com/tamagui/tamagui/blob/main/code/tamagui.dev/data/docs/guides/metro.mdx)   |
| Webpack   | Legacy Webpack loader configuration | [docs](https://github.com/tamagui/tamagui/blob/main/code/tamagui.dev/data/docs/guides/webpack.mdx) |
| One       | One framework integration           | [docs](https://github.com/tamagui/tamagui/blob/main/code/tamagui.dev/data/docs/guides/one.mdx)     |

## Documentation

| Topic                 | Description                         | URL                                                                                                        |
| --------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Compiler Installation | Setup guide for adding the compiler | [docs](https://github.com/tamagui/tamagui/blob/main/code/tamagui.dev/data/docs/intro/compiler-install.mdx) |
| Why a Compiler        | Performance benefits and tradeoffs  | [docs](https://github.com/tamagui/tamagui/blob/main/code/tamagui.dev/data/docs/intro/why-a-compiler.mdx)   |
| Benchmarks            | Performance comparisons and metrics | [docs](https://github.com/tamagui/tamagui/blob/main/code/tamagui.dev/data/docs/intro/benchmarks.mdx)       |
| Developing            | Local development and debugging     | [docs](https://github.com/tamagui/tamagui/blob/main/code/tamagui.dev/data/docs/guides/developing.mdx)      |

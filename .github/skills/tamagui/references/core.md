# Tamagui Core

Core packages, configuration APIs, hooks, and theming system.

## Main Packages

| Package         | Description                     | Source                                                                  |
| --------------- | ------------------------------- | ----------------------------------------------------------------------- |
| @tamagui/core   | Core styling engine             | [source](https://github.com/tamagui/tamagui/tree/main/code/core/core)   |
| @tamagui/web    | Web-specific implementation     | [source](https://github.com/tamagui/tamagui/tree/main/code/core/web)    |
| tamagui         | Full package with UI components | [source](https://github.com/tamagui/tamagui/tree/main/code/ui/tamagui)  |
| @tamagui/config | Pre-built configuration         | [source](https://github.com/tamagui/tamagui/tree/main/code/core/config) |

## Configuration APIs

| API           | Description               | Docs                                                                                                   |
| ------------- | ------------------------- | ------------------------------------------------------------------------------------------------------ |
| createTamagui | Initialize Tamagui config | [docs](https://github.com/tamagui/tamagui/blob/main/code/tamagui.dev/data/docs/core/configuration.mdx) |
| createTokens  | Define design tokens      | [docs](https://github.com/tamagui/tamagui/blob/main/code/tamagui.dev/data/docs/core/tokens.mdx)        |
| createThemes  | Generate theme variants   | [docs](https://github.com/tamagui/tamagui/blob/main/code/tamagui.dev/data/docs/intro/themes.mdx)       |
| styled()      | Create styled components  | [docs](https://github.com/tamagui/tamagui/blob/main/code/tamagui.dev/data/docs/core/styled.mdx)        |
| variants      | Define component variants | [docs](https://github.com/tamagui/tamagui/blob/main/code/tamagui.dev/data/docs/core/variants.mdx)      |

## Theme System

| Package                  | Description                 | Source                                                                           |
| ------------------------ | --------------------------- | -------------------------------------------------------------------------------- |
| @tamagui/theme           | Theme context and provider  | [source](https://github.com/tamagui/tamagui/tree/main/code/core/theme)           |
| @tamagui/themes          | Pre-built theme palettes    | [source](https://github.com/tamagui/tamagui/tree/main/code/core/themes)          |
| @tamagui/theme-base      | Base theme utilities        | [source](https://github.com/tamagui/tamagui/tree/main/code/core/theme-base)      |
| @tamagui/theme-builder   | Theme generation helpers    | [source](https://github.com/tamagui/tamagui/tree/main/code/core/theme-builder)   |
| @tamagui/create-theme    | Create custom themes        | [source](https://github.com/tamagui/tamagui/tree/main/code/core/create-theme)    |
| @tamagui/generate-themes | Build-time theme generation | [source](https://github.com/tamagui/tamagui/tree/main/code/core/generate-themes) |

## Animation Drivers

Swappable animation systems for different platforms.

| Driver                           | Description            | Docs                                                                                                | Source                                                                                   |
| -------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| @tamagui/animations-css          | CSS transitions (web)  | [docs](https://github.com/tamagui/tamagui/blob/main/code/tamagui.dev/data/docs/core/animations.mdx) | [source](https://github.com/tamagui/tamagui/tree/main/code/core/animations-css)          |
| @tamagui/animations-react-native | React Native Animated  | [docs](https://github.com/tamagui/tamagui/blob/main/code/tamagui.dev/data/docs/core/animations.mdx) | [source](https://github.com/tamagui/tamagui/tree/main/code/core/animations-react-native) |
| @tamagui/animations-moti         | Moti/Reanimated driver | [docs](https://github.com/tamagui/tamagui/blob/main/code/tamagui.dev/data/docs/core/animations.mdx) | [source](https://github.com/tamagui/tamagui/tree/main/code/core/animations-moti)         |
| @tamagui/animations-motion       | Framer Motion driver   | -                                                                                                   | [source](https://github.com/tamagui/tamagui/tree/main/code/core/animations-motion)       |

## Hooks

| Hook     | Description                 | Docs                                                                                               |
| -------- | --------------------------- | -------------------------------------------------------------------------------------------------- |
| useMedia | Responsive media queries    | [docs](https://github.com/tamagui/tamagui/blob/main/code/tamagui.dev/data/docs/core/use-media.mdx) |
| useTheme | Access current theme values | [docs](https://github.com/tamagui/tamagui/blob/main/code/tamagui.dev/data/docs/core/use-theme.mdx) |

## Hook Packages

| Package                         | Description                   | Source                                                                                  |
| ------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------- |
| @tamagui/use-debounce           | Debounced values              | [source](https://github.com/tamagui/tamagui/tree/main/code/core/use-debounce)           |
| @tamagui/use-event              | Stable event callbacks        | [source](https://github.com/tamagui/tamagui/tree/main/code/core/use-event)              |
| @tamagui/use-force-update       | Force re-render               | [source](https://github.com/tamagui/tamagui/tree/main/code/core/use-force-update)       |
| @tamagui/use-controllable-state | Controlled/uncontrolled state | [source](https://github.com/tamagui/tamagui/tree/main/code/core/use-controllable-state) |
| @tamagui/use-keyboard-visible   | Keyboard visibility detection | [source](https://github.com/tamagui/tamagui/tree/main/code/core/use-keyboard-visible)   |
| @tamagui/use-window-dimensions  | Window size hook              | [source](https://github.com/tamagui/tamagui/tree/main/code/core/use-window-dimensions)  |

## Font Packages

Pre-configured font families ready to use.

| Package                  | Font       | Source                                                                           |
| ------------------------ | ---------- | -------------------------------------------------------------------------------- |
| @tamagui/font-inter      | Inter      | [source](https://github.com/tamagui/tamagui/tree/main/code/core/font-inter)      |
| @tamagui/font-dm-sans    | DM Sans    | [source](https://github.com/tamagui/tamagui/tree/main/code/core/font-dm-sans)    |
| @tamagui/font-fira-mono  | Fira Mono  | [source](https://github.com/tamagui/tamagui/tree/main/code/core/font-fira-mono)  |
| @tamagui/font-silkscreen | Silkscreen | [source](https://github.com/tamagui/tamagui/tree/main/code/core/font-silkscreen) |

## Utilities

| Package             | Description               | Source                                                                      |
| ------------------- | ------------------------- | --------------------------------------------------------------------------- |
| @tamagui/helpers    | Shared helper functions   | [source](https://github.com/tamagui/tamagui/tree/main/code/core/helpers)    |
| @tamagui/constants  | Shared constants          | [source](https://github.com/tamagui/tamagui/tree/main/code/core/constants)  |
| @tamagui/colors     | Color palette utilities   | [source](https://github.com/tamagui/tamagui/tree/main/code/core/colors)     |
| @tamagui/shorthands | Style property shorthands | [source](https://github.com/tamagui/tamagui/tree/main/code/core/shorthands) |
| @tamagui/get-token  | Token access utilities    | [source](https://github.com/tamagui/tamagui/tree/main/code/core/get-token)  |
| @tamagui/floating   | Floating UI integration   | [source](https://github.com/tamagui/tamagui/tree/main/code/core/floating)   |

## CLI

| Tool           | Description         | Docs                                                                                                          | Source                                                                          |
| -------------- | ------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| @tamagui/cli   | Build and dev tools | [docs](https://github.com/tamagui/tamagui/blob/main/code/tamagui.dev/data/docs/guides/cli.mdx)                | [source](https://github.com/tamagui/tamagui/tree/main/code/core/cli)            |
| create-tamagui | Project scaffolding | [docs](https://github.com/tamagui/tamagui/blob/main/code/tamagui.dev/data/docs/guides/create-tamagui-app.mdx) | [source](https://github.com/tamagui/tamagui/tree/main/code/core/create-tamagui) |

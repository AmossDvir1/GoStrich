/**
 * Font Configuration Reference
 *
 * Font switching is controlled via the ACTIVE_FONT environment variable.
 *
 * Quick start commands:
 *   npm run start:koho           # Test KoHo font
 *   npm run start:montserrat     # Test Montserrat (default)
 *   npm run ios:koho             # Run on iOS with KoHo
 *   npm run android:koho         # Run on Android with KoHo
 *
 * Each font definition is in tamagui.config.ts under the createFont() calls.
 * Add new fonts by:
 *   1. Creating a new createFont() object in tamagui.config.ts
 *   2. Adding it to the activeFont selector logic
 *   3. Adding npm scripts for convenience
 *   4. Updating font-test.tsx to showcase the new font
 */

/**
 * Reference: Montserrat weights and styles
 * Used when ACTIVE_FONT is not set or equals "montserrat"
 * Full weight range: 100-900
 */
export const MONTSERRAT_REFERENCE = {
  weights: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  styles: ["normal", "italic"],
  sizes: [12, 14, 15, 16, 18, 20, 24, 28, 32],
};

/**
 * Reference: KoHo weights and styles
 * Used when ACTIVE_FONT=koho
 * Limited weight range: 300-700
 */
export const KOHO_REFERENCE = {
  weights: ["300", "400", "500", "600", "700"],
  styles: ["normal", "italic"],
  sizes: [12, 14, 15, 16, 18, 20, 24, 28, 32],
};

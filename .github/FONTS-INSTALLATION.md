# Custom Font Integration Guide (Montserrat + Tamagui)

This guide explains how to integrate the Montserrat font family into the GoStrich app, ensuring compatibility with Expo, React Native, and Tamagui.

## 1. Prepare Font Assets

Move the required font files from the `static/` folder of your download into your project.

**Path:** `assets/fonts/`

Recommended files to include for a full design range:

- `Montserrat-Thin.ttf` (100)
- `Montserrat-Light.ttf` (300)
- `Montserrat-Regular.ttf` (400)
- `Montserrat-Medium.ttf` (500)
- `Montserrat-SemiBold.ttf` (600)
- `Montserrat-Bold.ttf` (700)
- `Montserrat-Black.ttf` (900)
- _Include Italic versions if needed (e.g., Montserrat-Italic.ttf)_

## 2. Install Dependencies

Ensure you have the necessary Expo font packages:

```bash
npx expo install expo-font expo-splash-screen
3. Configure Tamagui Font Tokens
To use these fonts with Tamagui's <Text> and <Heading> components, you must define a font object in your tamagui.config.ts.
File: tamagui.config.ts
code
TypeScript
import { createFont, createTamagui } from 'tamagui';

const montserratConfig = createFont({
  family: 'Montserrat-Regular', // The base name used in CSS/Native
  size: {
    1: 12,
    2: 14,
    3: 15,
    4: 16,
    true: 16, // Default
    5: 18,
    6: 20,
    9: 32,
  },
  lineHeight: {
    1: 17,
    2: 19,
    4: 22,
  },
  weight: {
    1: '100',
    4: '400',
    6: '600',
    7: '700',
  },
  letterSpacing: {
    4: 0,
    8: -1,
  },
  // Map the weights to the actual loaded font files
  face: {
    100: { normal: 'Montserrat-Thin' },
    300: { normal: 'Montserrat-Light' },
    400: { normal: 'Montserrat-Regular', italic: 'Montserrat-Italic' },
    500: { normal: 'Montserrat-Medium' },
    600: { normal: 'Montserrat-SemiBold' },
    700: { normal: 'Montserrat-Bold' },
    900: { normal: 'Montserrat-Black' },
  },
});

const config = createTamagui({
  fonts: {
    heading: montserratConfig,
    body: montserratConfig,
  },
  // ... rest of your config
});

export default config;
4. Load Fonts in Root Layout
Since GoStrich uses Expo Router, you should load the fonts in the root layout to ensure they are available before the app renders.
File: app/_layout.tsx
code
Tsx
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { TamaguiProvider } from 'tamagui';
import config from '../tamagui.config';

// Prevent the splash screen from auto-hiding before fonts load
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'Montserrat-Thin': require('../assets/fonts/Montserrat-Thin.ttf'),
    'Montserrat-Light': require('../assets/fonts/Montserrat-Light.ttf'),
    'Montserrat-Regular': require('../assets/fonts/Montserrat-Regular.ttf'),
    'Montserrat-Medium': require('../assets/fonts/Montserrat-Medium.ttf'),
    'Montserrat-SemiBold': require('../assets/fonts/Montserrat-SemiBold.ttf'),
    'Montserrat-Bold': require('../assets/fonts/Montserrat-Bold.ttf'),
    'Montserrat-Black': require('../assets/fonts/Montserrat-Black.ttf'),
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <TamaguiProvider config={config}>
      {/* Your Stack or Tabs router */}
    </TamaguiProvider>
  );
}
5. Usage in Components
Now you can use the font via Tamagui props or standard React Native styles.
Using Tamagui (Recommended)
Tamagui will automatically handle the mapping of weights to the correct font file based on your face configuration in tamagui.config.ts.
code
Tsx
import { Text, Heading, YStack } from 'tamagui';

export function Demo() {
  return (
    <YStack>
      <Heading fontFamily="$heading" fontWeight="700">
        GoStrich Bold
      </Heading>
      <Text fontFamily="$body" fontWeight="400">
        This is Montserrat Regular
      </Text>
      <Text fontFamily="$body" fontWeight="100">
        Thin Runner
      </Text>
    </YStack>
  );
}
Using React Native Styles
If you need to use the font in a standard component:
code
Tsx
<Text style={{ fontFamily: 'Montserrat-Bold' }}>
  Native Bold Text
</Text>
6. (Optional) Production Optimization
For Development Builds (not Expo Go), you can embed the fonts natively to avoid the "Flash of Unstyled Text" (FOUT) and slightly improve startup time.
Update app.json:
code
JSON
{
  "expo": {
    "plugins": [
      [
        "expo-font",
        {
          "fonts": [
            "./assets/fonts/Montserrat-Regular.ttf",
            "./assets/fonts/Montserrat-Bold.ttf"
          ]
        }
      ]
    ]
  }
}
Note: After changing app.json plugins, you must run npx expo run:ios or npx expo run:android to rebuild the native directories.
Best Practices
Naming: Always name the font files exactly as they are identified in the useFonts hook and the Tamagui face config.
PostScript Names: If fonts don't appear on iOS, ensure the name used in useFonts matches the font's internal PostScript name (usually Family-Weight).
Variable Fonts: If you decide to use Montserrat-VariableFont_wght.ttf, keep in mind it may not work on older Android devices (pre-Android 9) or certain web browsers. The static .ttf files are safer for a "100% offline-first" app aimed at maximum reliability.
```

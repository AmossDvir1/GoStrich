const sharp = require("sharp");
const fs = require("fs");

// The exact background color from your Rive animation file
// This makes the icons blend perfectly with the in-app experience
const BG_COLOR = "#E9E8E2";
const INPUT_IMAGE = "./ostrich-transparent.png";
const OUT_DIR = "./assets/images/";

async function createAllAssets() {
  if (!fs.existsSync(INPUT_IMAGE)) {
    console.error(
      `❌ ERROR: Could not find '${INPUT_IMAGE}' in the root folder.`,
    );
    console.error(
      "Please place your background-less ostrich PNG there and name it 'ostrich-transparent.png'.",
    );
    return;
  }

  // Ensure output directory exists
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  console.log("⏳ Starting asset generation...");

  // --- Base settings: Most assets are 1024x1024 ---
  const size = 1024;

  // We place the transparent ostrich inside a square, leaving enough padding for circular masks
  const ostrichResize = 600;
  const transparentExtends = {
    top: 212,
    bottom: 212,
    left: 212,
    right: 212,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  };

  // Generate a buffer of the ostrich pre-scaled and padded for use later
  const ostrichBuffer = await sharp(INPUT_IMAGE)
    .resize(ostrichResize, ostrichResize, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .extend(transparentExtends)
    .png()
    .toBuffer();

  // --- 1. icon.png ---
  // The primary, non-adaptive icon used on older devices and iOS. We add the solid background.
  await sharp(ostrichBuffer)
    .extend({ top: 0, bottom: 0, left: 0, right: 0, background: BG_COLOR })
    .flatten({ background: BG_COLOR }) // Flatten transparent parts into the solid background
    .toFile(OUT_DIR + "icon.png");
  console.log("✅ 1/6: icon.png generated");

  // --- 2. splash-icon.png ---
  // The icon that appears in the center of the beige launch screen. Must be transparent.
  // We keep it a bit smaller for elegance.
  await sharp(INPUT_IMAGE)
    .resize(500, 500, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .extend({
      top: 262,
      bottom: 262,
      left: 262,
      right: 262,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(OUT_DIR + "splash-icon.png");
  console.log("✅ 2/6: splash-icon.png generated");

  // --- 3. android-icon-foreground.png ---
  // Transparent foreground layer for adaptive icons. Uses pre-scaled buffer.
  await sharp(ostrichBuffer)
    .png()
    .toFile(OUT_DIR + "android-icon-foreground.png");
  console.log("✅ 3/6: android-icon-foreground.png generated");

  // --- 4. android-icon-background.png ---
  // Just a solid block of the beige color.
  await sharp({
    create: { width: size, height: size, channels: 4, background: BG_COLOR },
  })
    .png()
    .toFile(OUT_DIR + "android-icon-background.png");
  console.log("✅ 4/6: android-icon-background.png generated");

  // --- 5. favicon.png ---
  // Tiny transparent icon for web builds.
  await sharp(INPUT_IMAGE)
    .resize(48, 48, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toFile(OUT_DIR + "favicon.png");
  console.log("✅ 5/6: favicon.png generated");

  // --- 6. android-icon-monochrome.png ---
  // This is the cool modern one. Modern Android "Material You" themes turn icons
  // into solid color silhouettes. This file must be a solid white silhouette on transparency.

  // Create a solid white block
  const whiteBlock = await sharp({
    create: { width: size, height: size, channels: 4, background: "#FFFFFF" },
  })
    .png()
    .toBuffer();

  // Composite the pre-scaled ostrich OVER the white block, using the ostrich's alpha channel
  await sharp(ostrichBuffer)
    .composite([{ input: whiteBlock, blend: "in" }]) // 'in' blend mode restricts input to the destination's alpha mask
    .png()
    .toFile(OUT_DIR + "android-icon-monochrome.png");
  console.log("✅ 6/6: android-icon-monochrome.png generated");

  console.log(
    "🎉 SUCCESS: All assets replaced. Run 'npx expo prebuild --clean' if using dev clients.",
  );
}

createAllAssets();

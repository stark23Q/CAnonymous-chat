// Script to generate all required PWA icon sizes from the source 1024x1024 PNG
// Run with: node apps/web/scripts/generate-icons.mjs
// Requires: npm i -g sharp (or install locally)

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(__dirname, '../public/icons/icon-source.png');
const outDir = path.join(__dirname, '../public/icons');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Try using sharp if available, otherwise use canvas or just copy
try {
  const sharp = await import('sharp').catch(() => null);
  if (sharp) {
    for (const size of sizes) {
      await sharp.default(src)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
        .png()
        .toFile(path.join(outDir, `icon-${size}.png`));
      console.log(`✅ Generated icon-${size}.png`);
    }
    console.log('🎉 All icons generated!');
  } else {
    // Fallback: copy source as all sizes (Play Store will use icon-512)
    console.log('sharp not found — copying source PNG as all sizes');
    const { copyFileSync } = await import('fs');
    for (const size of sizes) {
      copyFileSync(src, path.join(outDir, `icon-${size}.png`));
      console.log(`📋 Copied as icon-${size}.png`);
    }
  }
} catch (e) {
  console.error('Error:', e.message);
}

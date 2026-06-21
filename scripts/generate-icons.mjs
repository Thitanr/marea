/**
 * Generates PNG icons from favicon.svg using @resvg/resvg-js
 * Run: node scripts/generate-icons.mjs
 */
import { Resvg } from '@resvg/resvg-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const publicDir = path.join(root, 'public');

const svgRaw = fs.readFileSync(path.join(publicDir, 'favicon.svg'), 'utf8');

function buildWrappedSvg(size, padding) {
    const inner = size - padding * 2;
    // Encode SVG for data URI
    const encoded = Buffer.from(svgRaw).toString('base64');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" fill="#0a0f0d"/>
  <image x="${padding}" y="${padding}" width="${inner}" height="${inner}"
         href="data:image/svg+xml;base64,${encoded}"/>
</svg>`;
}

function render(svgStr, size) {
    const resvg = new Resvg(svgStr, {
        fitTo: { mode: 'width', value: size },
    });
    return resvg.render().asPng();
}

const specs = [
    { file: 'icon-192.png',           size: 192, padFraction: 0 },
    { file: 'icon-512.png',           size: 512, padFraction: 0 },
    { file: 'icon-192-maskable.png',  size: 192, padFraction: 0.12 },
    { file: 'icon-512-maskable.png',  size: 512, padFraction: 0.12 },
    { file: 'apple-touch-icon.png',   size: 180, padFraction: 0.04 },
];

for (const { file, size, padFraction } of specs) {
    const padding = Math.round(size * padFraction);
    const svg = buildWrappedSvg(size, padding);
    const png = render(svg, size);
    const outPath = path.join(publicDir, file);
    fs.writeFileSync(outPath, png);
    console.log(`✓ ${file} (${size}×${size}, padding=${padding}px)`);
}

console.log('\nAll icons generated.');

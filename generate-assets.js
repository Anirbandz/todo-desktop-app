const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Simple SVG-based icon generator
function generateIcon() {
    const svg = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#grad)" rx="50"/>
  <text x="256" y="256" font-family="Arial, sans-serif" font-size="200" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="white">✓</text>
  <text x="256" y="400" font-family="Arial, sans-serif" font-size="48" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="white">TaskFlow</text>
</svg>`;

    // Convert SVG to PNG using sharp
    const svgBuffer = Buffer.from(svg);
    sharp(svgBuffer)
        .png()
        .toFile(path.join(__dirname, 'assets', 'icon.png'))
        .then(() => {
            console.log('Icon PNG generated successfully!');
        })
        .catch(err => {
            console.error('Error generating icon:', err);
        });
}

function generateDMGBackground() {
    const svg = `
<svg width=\"540\" height=\"380\" xmlns=\"http://www.w3.org/2000/svg\">\n  <defs>\n    <linearGradient id=\"dmgGrad\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\">\n      <stop offset=\"0%\" style=\"stop-color:#667eea;stop-opacity:1\" />\n      <stop offset=\"100%\" style=\"stop-color:#764ba2;stop-opacity:1\" />\n    </linearGradient>\n  </defs>\n  <rect width=\"540\" height=\"380\" fill=\"url(#dmgGrad)\"/>\n  <text x=\"270\" y=\"190\" font-family=\"Arial, sans-serif\" font-size=\"48\" font-weight=\"bold\" text-anchor=\"middle\" dominant-baseline=\"middle\" fill=\"white\">TaskFlow</text>\n  <text x=\"270\" y=\"240\" font-family=\"Arial, sans-serif\" font-size=\"24\" text-anchor=\"middle\" dominant-baseline=\"middle\" fill=\"white\">Drag to Applications to install</text>\n</svg>`;

    // Convert SVG to PNG using sharp
    const svgBuffer = Buffer.from(svg);
    sharp(svgBuffer)
        .png()
        .toFile(path.join(__dirname, 'assets', 'dmg-background.png'))
        .then(() => {
            console.log('DMG background PNG generated successfully!');
        })
        .catch(err => {
            console.error('Error generating DMG background:', err);
        });
}

// Create assets directory if it doesn't exist
if (!fs.existsSync(path.join(__dirname, 'assets'))) {
    fs.mkdirSync(path.join(__dirname, 'assets'));
}

console.log('Generating assets...');
generateIcon();
generateDMGBackground();
console.log('Asset generation started. Check the assets/ folder for PNG files.'); 
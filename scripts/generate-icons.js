const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function generateIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#ec7a0d');
  gradient.addColorStop(1, '#dd5f08');
  
  // Rounded rectangle
  const radius = size * 0.18;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // Text
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size * 0.4}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🎓', size / 2, size * 0.4);
  
  ctx.font = `bold ${size * 0.15}px Arial`;
  ctx.fillText('LOMBA', size / 2, size * 0.7);
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(__dirname, '..', 'public', filename), buffer);
  console.log(`Generated ${filename}`);
}

// Generate icons
generateIcon(192, 'icon-192.png');
generateIcon(512, 'icon-512.png');
console.log('All icons generated!');

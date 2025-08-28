const fs = require('fs');
const path = require('path');

// Create public directory if it doesn't exist
const publicDir = path.join(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
  console.log('Created public directory');
}

// Copy files from server/public to public if they don't exist
const serverPublicDir = path.join(__dirname, '../server/public');
const filesToCopy = ['index.html', 'dashboard.html', 'test.html'];

filesToCopy.forEach(file => {
  const source = path.join(serverPublicDir, file);
  const dest = path.join(publicDir, file);
  
  if (fs.existsSync(source) && !fs.existsSync(dest)) {
    fs.copyFileSync(source, dest);
    console.log(`Copied ${file} to public directory`);
  }
});

console.log('Public directory setup complete');
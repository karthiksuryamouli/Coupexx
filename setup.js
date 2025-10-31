const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up Coupon Tracker Mobile App...\n');

try {
  const nodeVersion = process.version;
  console.log(`✅ Node.js version: ${nodeVersion}`);
} catch (error) {
  console.error('❌ Node.js is not installed. Please install Node.js first.');
  process.exit(1);
}

try {
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  console.log(`✅ npm version: ${npmVersion}`);
} catch (error) {
  console.error('❌ npm is not available. Please install npm.');
  process.exit(1);
}

console.log('\n📦 Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed successfully!');
} catch (error) {
  console.error('❌ Failed to install dependencies. Please try running "npm install" manually.');
  process.exit(1);
}

try {
  execSync('expo --version', { encoding: 'utf8' });
  console.log('✅ Expo CLI is installed');
} catch (error) {
  console.log('📦 Installing Expo CLI globally...');
  try {
    execSync('npm install -g @expo/cli', { stdio: 'inherit' });
    console.log('✅ Expo CLI installed successfully!');
  } catch (error) {
    console.error('❌ Failed to install Expo CLI. Please install it manually: npm install -g @expo/cli');
  }
}

const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir);
  console.log('📁 Created assets directory');
}

console.log('\n🎉 Setup completed successfully!');
console.log('\n📱 To start the app:');
console.log('   npm start');
console.log('\n📱 To run on iOS simulator:');
console.log('   npm start (then press "i")');
console.log('\n📱 To run on Android emulator:');
console.log('   npm start (then press "a")');
console.log('\n📱 To run on your device:');
console.log('   1. Install Expo Go app from App Store/Play Store');
console.log('   2. Scan the QR code that appears in the terminal');
console.log('\n📚 For more information, check the README.md file');
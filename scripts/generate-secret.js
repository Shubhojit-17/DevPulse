const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');

function generateSecret() {
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found. Please copy .env.example to .env first.');
    process.exit(1);
  }

  let envContent = fs.readFileSync(envPath, 'utf8');

  // Check if NEXTAUTH_SECRET exists but is empty
  const emptySecretRegex = /^NEXTAUTH_SECRET=$/m;
  
  if (emptySecretRegex.test(envContent)) {
    const secret = crypto.randomBytes(32).toString('base64');
    envContent = envContent.replace(emptySecretRegex, `NEXTAUTH_SECRET=${secret}`);
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log('✓ NEXTAUTH_SECRET generated');
  } else if (/^NEXTAUTH_SECRET=.+/m.test(envContent)) {
    console.log('NEXTAUTH_SECRET already set — skipping');
  } else {
    // If NEXTAUTH_SECRET is not in the file at all
    const secret = crypto.randomBytes(32).toString('base64');
    envContent += `\nNEXTAUTH_SECRET=${secret}\n`;
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log('✓ NEXTAUTH_SECRET generated');
  }
}

generateSecret();

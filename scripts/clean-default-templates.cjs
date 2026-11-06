const fs = require('fs');
const path = require('path');

const certDir = path.resolve(__dirname, '..', 'assets', 'certificates');

try {
  if (fs.existsSync(certDir)) {
    console.log('Certificates directory exists at:', certDir);
    const files = fs.readdirSync(certDir);
    console.log('Files in assets/certificates:', files);
  } else {
    console.log('Directory does not exist');
  }
} catch (e) {
  console.error('Error reading certDir:', e.message);
}

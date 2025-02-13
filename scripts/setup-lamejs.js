const fs = require('fs');
const path = require('path');
const https = require('https');
const fetch = require('node-fetch');

const LAME_VERSION = '1.2.1';
const LAME_URL = `https://cdn.jsdelivr.net/npm/lamejs@${LAME_VERSION}/dist/lame.all.js`;
const OUTPUT_DIR = path.join(__dirname, '../public/lib');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'lame.min.js');

async function setupLame() {
  try {
    console.log('Setting up lamejs...');
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Download lamejs
    const response = await fetch(LAME_URL);
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.status}`);
    }

    let content = await response.text();
    
    // Modify the content to work in a worker context
    content = content
      .replace(/window/g, 'self')
      .replace(/typeof exports/g, 'typeof self.exports')
      .replace(/module\.exports/g, 'self.exports')
      .replace(/new Error/g, 'new self.Error')
      // Fix constructor issues
      .replace(
        /function Mp3Encoder\((\s*[^)]*)\)/g, 
        'self.lamejs.Mp3Encoder = function($1)'
      );

    // Add initialization wrapper
    const wrapper = fs.readFileSync(
      path.join(__dirname, '../public/lib/lame.init.js'), 
      'utf8'
    );

    // Create the final bundle
    const bundle = `
      ${wrapper}

      // Main lamejs implementation
      (function(global) {
        try {
          ${content}
          console.log('Lamejs implementation loaded');
        } catch (error) {
          console.error('Failed to load lamejs implementation:', error);
        }
      })(self);

      // Initialize the encoder
      self.initializeLamejs().catch(console.error);
    `;
    
    // Write the bundle
    fs.writeFileSync(OUTPUT_FILE, bundle);
    console.log('Lamejs setup complete');
    
  } catch (error) {
    console.error('Failed to setup lamejs:', error);
    process.exit(1);
  }
}

setupLame(); 
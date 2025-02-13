// Initialize lamejs in worker scope
(function(global) {
  // Create namespace
  if (!global.lamejs) {
    global.lamejs = {};
  }

  // Create initialization state
  let isInitialized = false;
  let initError = null;
  let initPromise = null;

  // Store the original Mp3Encoder if it exists
  const originalEncoder = global.lamejs.Mp3Encoder;

  // Add initialization helper
  global.initializeLamejs = function() {
    if (initPromise) return initPromise;

    initPromise = new Promise((resolve, reject) => {
      // Maximum time to wait for initialization
      const MAX_WAIT_TIME = 10000; // 10 seconds
      const startTime = Date.now();

      function checkEncoder() {
        // Check if we've waited too long
        if (Date.now() - startTime > MAX_WAIT_TIME) {
          initError = new Error('Initialization timed out');
          reject(initError);
          return;
        }

        try {
          // Check if Mp3Encoder is available
          const Encoder = originalEncoder || global.lamejs.Mp3Encoder;
          if (typeof Encoder === 'function') {
            // Test encoder
            const testEncoder = new Encoder(1, 44100, 128);
            if (testEncoder && typeof testEncoder.encodeBuffer === 'function') {
              // Store the working encoder
              global.lamejs.Mp3Encoder = Encoder;
              console.log('Lamejs encoder initialized successfully');
              isInitialized = true;
              resolve();
              return;
            }
          }
        } catch (e) {
          console.warn('Encoder not ready yet:', e);
        }

        // Try again in 100ms
        setTimeout(checkEncoder, 100);
      }

      // Start checking
      checkEncoder();
    });

    return initPromise;
  };

  // Export initialization status
  Object.defineProperty(global.lamejs, 'isInitialized', {
    get: () => isInitialized
  });

  Object.defineProperty(global.lamejs, 'initError', {
    get: () => initError
  });
})(self); 
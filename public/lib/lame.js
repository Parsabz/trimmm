// Initialize global objects
self.lamejs = {
  version: '1.2.1'
};

// Create Mp3Encoder class
self.lamejs.Mp3Encoder = function(channels, sampleRate, kbps) {
  this.channels = channels;
  this.sampleRate = sampleRate;
  this.bitRate = kbps;
  
  this.encodeBuffer = function(left, right) {
    // Implementation will be added by the actual lamejs code
    return new Int8Array(0);
  };
  
  this.flush = function() {
    // Implementation will be added by the actual lamejs code
    return new Int8Array(0);
  };
};

// Make Mp3LameEncoder globally available
self.Mp3LameEncoder = self.lamejs.Mp3Encoder;

// Load the actual lamejs implementation
(function() {
  // Paste the minified code from lamejs here, but wrap it properly
  var lamejs = function(exports) {
    'use strict';
    
    // Paste the contents of https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.min.js here
    // Make sure to remove any UMD wrapper and just keep the implementation
    
    return exports;
  }(self.lamejs);
  
  // Verify the initialization
  if (!self.Mp3LameEncoder.prototype.encodeBuffer || !self.Mp3LameEncoder.prototype.flush) {
    throw new Error('Lamejs encoder not properly initialized');
  }
})();

// Log successful initialization
console.log('Lamejs initialized successfully:', {
  version: self.lamejs.version,
  hasEncoder: typeof self.Mp3LameEncoder === 'function'
}); 
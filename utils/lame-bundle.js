// This is a simplified version of the lamejs encoder
const lamejs = require('lamejs');

// Export the necessary parts
module.exports = {
  Mp3Encoder: lamejs.Mp3Encoder,
  Lame: lamejs.Lame,
  Version: lamejs.Version,
  BitStream: lamejs.BitStream,
  MPEGMode: {
    STEREO: 0,
    JOINT_STEREO: 1,
    DUAL_CHANNEL: 2,
    MONO: 3
  }
}; 
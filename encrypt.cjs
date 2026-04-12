const fs = require('fs');
const crypto = require('crypto');

const inputFile = 'src/assets/models/cyberdog.glb';
const outputFile = 'cyberdog.glb.enc';

// 32 bytes key (save this somewhere safe!)
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);

const data = fs.readFileSync(inputFile);

const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);

fs.writeFileSync(outputFile, Buffer.concat([iv, encrypted]));

console.log('Encryption done!');
console.log('SAVE THIS KEY:', key.toString('hex'));
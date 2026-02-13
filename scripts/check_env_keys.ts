
const fs = require('fs');
const content = fs.readFileSync('.env.local', 'utf8');
const keys = content.split('\n').filter(l => l.includes('=')).map(l => l.split('=')[0]);
console.log(keys);

const fs = require('fs');
const file = 'C:/Users/sharm/OneDrive/Desktop/MockX/frontend/web/public/imu4.json';
let text = fs.readFileSync(file, 'utf8');

let count = 0;
text = text.replace(/"subject":\s*"aptitude"/g, () => { count++; return '"subject": "apt"'; });
text = text.replace(/"subject":\s*"physics"/g, () => { count++; return '"subject": "phy"'; });
text = text.replace(/"subject":\s*"chemistry"/g, () => { count++; return '"subject": "chem"'; });
text = text.replace(/"subject":\s*"maths"/g, () => { count++; return '"subject": "math"'; });

fs.writeFileSync(file, text);
console.log('Fixed subjects. Number of replacements: ' + count);

const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '../next-crm/src/components/TasksClient.tsx');
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/navigate/g, 'router.push');
fs.writeFileSync(file, content);

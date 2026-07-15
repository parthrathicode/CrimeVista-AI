const { execSync } = require('child_process');
const port = process.env.X_ZOHO_CATALYST_LISTEN_PORT || 9000;
process.env.PORT = port;
console.log(`Starting Vinxi Server on port ${port}...`);
execSync('npx vinxi start', { stdio: 'inherit' });

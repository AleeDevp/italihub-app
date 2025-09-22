// Wrapper to seed ALL cities, ignoring any LIMIT env var in the current shell.
const { spawnSync } = require('child_process');
const path = require('path');

const env = { ...process.env };
// Ensure LIMIT is not set
delete env.LIMIT;

const scriptPath = path.join(__dirname, 'seed-cities.js');
const res = spawnSync(process.execPath, [scriptPath], { stdio: 'inherit', env });
process.exit(res.status ?? 0);

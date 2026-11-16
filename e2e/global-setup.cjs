const { execFileSync } = require('node:child_process');
const path = require('node:path');
module.exports = async () => {
  // Reset fixture data for each E2E run. Use only a dedicated demo/test database.
  execFileSync('npm', ['run', 'seed'], { cwd: path.resolve(__dirname, '..'), stdio: 'inherit', shell: process.platform === 'win32' });
};

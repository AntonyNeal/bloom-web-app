// This script ensures vite runs on a CORS-legal port (5173 or 5175)
const { execSync } = require('child_process');
const http = require('http');

const ports = [5173, 5175];
function checkPort(port) {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on('error', () => resolve(false));
  });
}

(async () => {
  for (const port of ports) {
    // eslint-disable-next-line no-await-in-loop
    if (await checkPort(port)) {
      console.log(`Starting vite on CORS-legal port: ${port}`);
      execSync(`npx vite --port ${port} --strictPort`, { stdio: 'inherit' });
      process.exit(0);
    } else {
      console.log(`Port ${port} is in use.`);
    }
  }
  console.error('No CORS-legal ports available (5173, 5175). Please free one and try again.');
  process.exit(1);
})();

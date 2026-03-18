const path = require('path');

const scriptDir = __dirname;
const deployRoot = path.resolve(scriptDir, '..');
const logsDir = path.join(deployRoot, 'logs');

module.exports = {
  apps: [
    {
      name: 'controle-estoque-backend',
      cwd: path.join(deployRoot, 'backend'),
      script: 'dist/app.js',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
        PORT: '4300',
      },
      autorestart: true,
      watch: false,
      max_restarts: 20,
      min_uptime: '10s',
      restart_delay: 5000,
      out_file: path.join(logsDir, 'backend.log'),
      error_file: path.join(logsDir, 'backend-error.log'),
      merge_logs: true,
      time: true,
    },
    {
      name: 'controle-estoque-frontend',
      cwd: scriptDir,
      script: 'serve-frontend.js',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
        FRONTEND_PORT: '4173',
      },
      autorestart: true,
      watch: false,
      max_restarts: 20,
      min_uptime: '10s',
      restart_delay: 5000,
      out_file: path.join(logsDir, 'frontend.log'),
      error_file: path.join(logsDir, 'frontend-error.log'),
      merge_logs: true,
      time: true,
    },
  ],
};

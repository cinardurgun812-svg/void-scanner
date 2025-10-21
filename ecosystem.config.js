module.exports = {
  apps: [
    {
      name: 'void-scanner-backend',
      script: './backend/scanner/server5005.js',
      cwd: 'C:\\Users\\durgu\\void-scanner',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5005
      }
    },
    {
      name: 'void-scanner-frontend',
      script: 'npm',
      args: 'start',
      cwd: 'C:\\Users\\durgu\\void-scanner\\frontend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};

module.exports = {
  apps: [
    {
      name: "banmaxia-store-analytics",
      script: "pnpm",
      args: "start",
      cwd: __dirname,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};

module.exports = {
  apps: [
    {
      name: "spacemc-main",
      script: "npm",
      args: "start",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 6969,
        DEFAULT_RUNTIME: "docker",
        ENABLE_DOCKER: "true",
        DOCKER_SOCKET_PATH: "/var/run/docker.sock"
      }
    }
  ]
};



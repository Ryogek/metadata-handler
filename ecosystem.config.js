module.exports = {
  apps : [{
    name   : "metadata-handler-server",
    script : "./server.js",
    env: {
      NODE_ENV: "development",
    },
    env_production: {
      NODE_ENV: "production"
    }
  }]
}

module.exports = {
    apps: [
        {
            name: "production",
            script: "./server.js",
            watch: true,
            env: {
                "NODE_ENV": "production",
            }
        }
    ]
}
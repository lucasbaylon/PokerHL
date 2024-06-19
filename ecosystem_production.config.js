module.exports = {
    apps: [
        {
            name: "PokerHL",
            script: "./server.js",
            watch: true,
            env: {
                "NODE_ENV": "production",
            }
        }
    ]
}
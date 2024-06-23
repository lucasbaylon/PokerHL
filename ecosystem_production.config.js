module.exports = {
    apps: [
        {
            name: "PokerHL",
            script: "./server.js",
            watch: true,
            env: {
                "NODE_ENV": "production",
            },
            log_date_format: "DD-MM-YYYY HH:mm Z"
        }
    ]
}
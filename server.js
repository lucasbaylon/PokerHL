const express = require('express');
const app = express();

const fs = require('fs')

const http = require('http').Server(app);

const optionsCors = {
    cors: {
        origin: 'http://localhost:4200',
        methods: ["GET", "POST"]
    }
};

const io = require('socket.io')(http, optionsCors);

// Create link to Angular build directory
// The `ng build` command will save the result
// under the `dist` folder.
// var distDir = __dirname + "/dist/";
// app.use(express.static(distDir));

// app.get('/', (req, res) => {
//     res.sendFile(__dirname + '/index.html');
// });

app.get("/api/check_situations_folder", function (req, res) {
    let situations_dir = './situations'
    if (fs.existsSync(situations_dir)) {
        console.log('Directory exists!')
        fs.readdir(situations_dir, function (err, data) {
            if (data.length == 0) {
                console.log("Directory is empty!");
                res.status(200).json({ authorized: false, message: "DIRECTORY_EMPTY" });
            } else {
                console.log("Directory is not empty!");
                res.status(200).json({ authorized: true, message: "OK" });
            }
        });
    } else {
        console.log('Directory not found.')
        res.status(200).json({ authorized: false, message: "DIRECTORY_NOT_FOUND" });
    }
});

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('AddSituation', (data) => {
        let situations_dir = './situations'
        let situation_name = data.situation_name;
        let file_name = situation_name.replace(/ /g, "_");
        
        let json = JSON.stringify(data.data);
        fs.writeFile(situations_dir + '/' + file_name + '.json', json, 'utf8', (err) => {
            if (err) return console.log(err);
            console.log('Situation ' + situation_name + ' créé !');
        });
    });
});

http.listen(3000, () => {
    console.log('listening on http://localhost:3000');
});
const express = require('express');
const app = express();

const fs = require('fs');
const path = require('path');

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

app.get("/api/test", function (req, res) {
    fs.readdir('./situations', function (err, data) {
        let test = [];
        console.log(data)
        if (data.length > 0) {
            data.forEach(situation => {
                const situation_file = fs.readFileSync(`./situations/${situation}`, 'utf8');
                test.push(JSON.parse(situation_file))
            })
        }
        res.json(test)
    });
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

    socket.on('GetSituations', () => {
        fs.readdir('./situations', function (err, situations) {
            let situationsList = [];
            if (situations.length > 0) {
                situations.forEach(situation => {
                    const situation_string = fs.readFileSync(`./situations/${situation}`, 'utf8');
                    situationsList.push(JSON.parse(situation_string));
                })
            }
            socket.emit('Situations', situationsList);
        });
    });

    socket.on('GetSituationsForTraining', (situationsListParam) => {
        let situationsList = JSON.parse(situationsListParam);
        fs.readdir('./situations', function (err, situations) {
            let situationsListForTraining = [];
            situations.forEach(situation => {
                let fileInfo = path.parse(`./situations/${situation}`);
                let situation_name = fileInfo.name;
                if(situationsList.includes(situation_name)) {
                    let situation_string = fs.readFileSync(`./situations/${situation}`, 'utf8');
                    situationsListForTraining.push(JSON.parse(situation_string));
                }
            })
            socket.emit('SituationsForTraining', situationsListForTraining);
        });
    });
});

http.listen(3000, () => {
    console.log('listening on http://localhost:3000');
});
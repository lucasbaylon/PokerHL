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

const situations_dir = './situations'

// Create link to Angular build directory
// The `ng build` command will save the result
// under the `dist` folder.
// var distDir = __dirname + "/dist/";
// app.use(express.static(distDir));

// app.get('/', (req, res) => {
//     res.sendFile(__dirname + '/index.html');
// });

function getSituations() {
    let situations_files = fs.readdirSync(situations_dir);
    let situationsList = [];
    if (situations_files.length > 0) {
        situations_files.forEach(situation => {
            const situation_string = fs.readFileSync(`${situations_dir}/${situation}`, 'utf8');
            situationsList.push(JSON.parse(situation_string));
        })
    }
    return situationsList;
}

io.on('connection', (socket) => {
    socket.on('AddSituation', (data) => {
        let situation_name = data.situation_name;
        let file_name = situation_name.replace(/ /g, "_");

        let json = JSON.stringify(data.data);
        fs.writeFile(`${situations_dir}/${file_name}.json`, json, 'utf8', (err) => {
            if (err) return console.log(err);
            console.log('Situation ' + situation_name + ' créé !');
        });
    });

    socket.on('RemoveSituation', (id) => {
        fs.unlinkSync(`${situations_dir}/${id}.json`);
        socket.emit('Situations', getSituations());
    });

    socket.on('GetSituations', () => {
        socket.emit('Situations', getSituations());
    });

    socket.on('GetSituationsForTraining', (situationsListParam) => {
        let situationsList = JSON.parse(situationsListParam);
        let situations_files = fs.readdirSync(situations_dir);
        let situationsListForTraining = [];
        situations_files.forEach(situation => {
            let fileInfo = path.parse(`${situations_dir}/${situation}`);
            let situation_name = fileInfo.name;
            if (situationsList.includes(situation_name)) {
                let situation_string = fs.readFileSync(`${situations_dir}/${situation}`, 'utf8');
                situationsListForTraining.push(JSON.parse(situation_string));
            }
        })
        socket.emit('SituationsForTraining', situationsListForTraining);
    });
});

http.listen(3000, () => {
    console.log('listening on http://localhost:3000');
});
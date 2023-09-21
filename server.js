const express = require('express');
cors = require('cors');
const app = express();

const fs = require('fs');
const path = require('path');

const http = require('http').Server(app);

app.use(cors());

const optionsCors = {
    maxHttpBufferSize: 1e9,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}

if (process.env.NODE_ENV === 'dev') {
    optionsCors.cors = {
        origin: 'http://localhost:4200',
        methods: ["GET", "POST"]
    }
}

const io = require('socket.io')(http, optionsCors);

const situations_dir = './situations';

var distDir = __dirname + "/dist/";
app.use(express.static(distDir));

app.get('/*', (req, res) => {
    res.sendFile(__dirname + '/dist/index.html');
});

app.get("/api/check_situations_folder", function (req, res) {
    if (fs.existsSync(situations_dir)) {
        // Directory exists!
        fs.readdir(situations_dir, function (err, data) {
            if (data.length == 0) {
                // Directory is empty!
                res.status(200).json({ authorized: false, message: "DIRECTORY_EMPTY" });
            } else {
                // Directory is not empty!
                res.status(200).json({ authorized: true, message: "OK" });
            }
        });
    } else {
        // Directory not found.
        res.status(200).json({ authorized: false, message: "DIRECTORY_NOT_FOUND" });
    }
});

app.get("/api/check_situation_id/:new_situation_id", function (req, res) {
    let new_situation_id = req.params.new_situation_id
    let situations_files = fs.readdirSync(situations_dir);
    let situation_exist = false;
    if (situations_files.length > 0) {
        situations_files.forEach(situation => {
            const situation_string = fs.readFileSync(`${situations_dir}/${situation}`, 'utf8');
            let situation_obj = JSON.parse(situation_string);
            if (new_situation_id === situation_obj._id) {
                situation_exist = true;
            }
        });
    }
    if (situation_exist) {
        res.status(200).json({ exist: true });
    } else {
        res.status(200).json({ exist: false });
    }
});

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
        let situation = data.data;
        let file_name = situation._id;

        let json = JSON.stringify(situation);
        fs.writeFileSync(`${situations_dir}/${file_name}.json`, json, 'utf8');
    });

    socket.on('EditSituation', (data) => {
        let situation = data.data;
        let file_name = situation._id;

        let json = JSON.stringify(situation);
        fs.writeFileSync(`${situations_dir}/${file_name}.json`, json, 'utf8');
    });

    socket.on('EditSituationWithRemove', (data) => {
        let situation = data.data;
        let ex_id_to_remove = data.ex_id;
        let file_name = situation._id;

        let json = JSON.stringify(situation);
        fs.writeFileSync(`${situations_dir}/${file_name}.json`, json, 'utf8');
        fs.unlinkSync(`${situations_dir}/${ex_id_to_remove}.json`);
    });

    socket.on('DuplicateSituation', (id) => {
        let new_id = "";
        if (fs.existsSync(`${situations_dir}/${id}_copy.json`)) {
            let situation_files = fs.readdirSync(situations_dir);
            let matchingFiles = situation_files.filter(file => file.startsWith(`${id}_copy`));
            new_id = `${id}_copy_${matchingFiles.length}`;
        } else {
            new_id = `${id}_copy`;
        }

        let situation_string = fs.readFileSync(`${situations_dir}/${id}.json`, 'utf8');
        let situation_obj = JSON.parse(situation_string);
        situation_obj._id = new_id;
        let new_name = new_id.replace(/_/g, " ");
        situation_obj.name = new_name;
        let situation_str = JSON.stringify(situation_obj);
        fs.writeFileSync(`${situations_dir}/${new_id}.json`, situation_str, 'utf8');
        socket.emit('Situations', getSituations());
    });

    socket.on('RemoveSituation', (id) => {
        fs.unlinkSync(`${situations_dir}/${id}.json`);
        socket.emit('Situations', getSituations());
    });

    socket.on('GetSituations', () => {
        socket.emit('Situations', getSituations());
    });

    socket.on('GetSituation', (id) => {
        let situation_string = fs.readFileSync(`${situations_dir}/${id}.json`, 'utf8');
        socket.emit('Situation', situation_string);
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
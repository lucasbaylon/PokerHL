const express = require('express');
cors = require('cors');
const app = express();

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const { getConnection } = require('./database');

const http = require('http').Server(app);

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

app.set('port', 3000);

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

app.use(cors(optionsCors));

const io = require('socket.io')(http, optionsCors);

const situations_dir = './situations';

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split('Bearer ')[1];

    if (!token) return res.status(401).send('Unauthorized');

    admin
        .auth()
        .verifyIdToken(token)
        .then((decodedToken) => {
            req.user = decodedToken;
            next();
        })
        .catch((error) => {
            console.error(error);
            res.status(401).send('Unauthorized');
        });
};

const protectedRouter = express.Router();

if (process.env.NODE_ENV !== 'dev') {
    protectedRouter.use(authMiddleware);
}

protectedRouter.get("/check_situations_folder", function (req, res) {
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

protectedRouter.get("/check_situation_name/:new_situation_name/:user", async function (req, res) {
    let new_situation_name = req.params.new_situation_name;
    let user = req.params.user;

    try {
        const connection = await getConnection();
        const [results] = await connection.execute('SELECT * FROM situations WHERE user = ?', [user]);

        const situation_exist = results.some(situation => {
            let situation_obj = JSON.parse(situation.json);
            return new_situation_name === situation_obj.name;
        });

        res.status(200).json({ exist: situation_exist });
    } catch (error) {
        console.error('Error querying the database:', error);
        // En cas d'erreur, envoyez une réponse 500 au client
        // res.status(500).json({ error: 'An error occurred while checking the situation name' });
    }
});

app.use('/api', protectedRouter);

if (process.env.NODE_ENV === 'production') {
    var distDir = __dirname + "/dist/";
    app.use(express.static(distDir));

    app.get('*', (req, res) => {
        res.sendFile(__dirname + '/dist/index.html');
    });
}

io.on('connection', (socket) => {
    socket.on('AddSituation', async (data) => {
        let situation = data.data;

        let json = JSON.stringify(situation);

        try {
            const connection = await getConnection();

            await connection.execute("INSERT INTO situations (json, user) VALUES (?, ?)", [json, data.user], function (error, results, fields) {
                if (error) throw error;
                console.log('Ligne insérée avec ID:', results.insertId);
            });
        } catch (error) {
            console.error('An error occurred:', error);
            // socket.emit('Error', 'An error occurred while duplicating the situation.');
        }
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

    socket.on('DuplicateSituation', async (data) => {
        const id = data.id;
        const user = data.user;

        try {
            const connection = await getConnection();
            // Récupérer l'objet situation original
            const [originalRows] = await connection.execute('SELECT json FROM situations WHERE id = ? AND user = ?', [id, user]);
            if (originalRows.length === 0) {
                throw new Error('Original situation not found');
            }
            const originalSituation = JSON.parse(originalRows[0].json);
            // console.log(originalSituation)

            // Récupérer tous les noms de situations pour l'utilisateur
            const [allSituations] = await connection.execute(
                'SELECT json FROM situations WHERE user = ?',
                [user]
            );
            const allNames = allSituations.map(situation => JSON.parse(situation.json).name);
            console.log(allNames)

            // Générer un nouveau nom unique
            let newName = `${originalSituation.name} copy`;
            let copyNumber = 1;
            while (allNames.includes(newName)) {
                copyNumber += 1;
                newName = `${originalSituation.name} copy ${copyNumber}`;
            }

            // Mettre à jour le nouvel objet situation
            originalSituation.name = newName;

            // Sauvegarder le nouvel objet situation
            await connection.execute('INSERT INTO situations (json, user) VALUES (?, ?)', [JSON.stringify(originalSituation), user]);

            // Récupérer toutes les situations et émettre l'événement socket
            const [newAllSituations] = await connection.execute(
                'SELECT * FROM situations WHERE user = ?',
                [user]
            );
            const situations = newAllSituations.map((situationObj) => {
                let parsedSituationJson = JSON.parse(situationObj.json);
                return { ...parsedSituationJson, id: situationObj.id };
            });
            socket.emit('Situations', situations);
        } catch (error) {
            console.error('An error occurred:', error);
            // socket.emit('Error', 'An error occurred while duplicating the situation.');
        }
    });

    socket.on('RemoveSituation', async (data) => {
        const id = data.id;
        const user = data.user;
        try {
            const connection = await getConnection();
            const [deleteResult] = await connection.execute('DELETE FROM situations WHERE id = ?', [id]);

            console.log('Nombre de lignes supprimées :', deleteResult.affectedRows);

            const [situationsResults] = await connection.execute('SELECT * FROM situations WHERE user = ?', [user]);
            let situations = situationsResults.map((situationObj) => {
                let parsedSituationJson = JSON.parse(situationObj.json);
                return { ...parsedSituationJson, id: situationObj.id };
            });

            socket.emit('Situations', situations);
        } catch (error) {
            console.error('Erreur lors de la suppression ou de la récupération des situations :', error);
            // Gérer l'erreur en informant également le client
            socket.emit('Error', 'An error occurred while removing or fetching situations');  // Vous pouvez ajuster ce message d'erreur selon vos besoins
        }
    });

    socket.on('GetSituations', async (user) => {
        try {
            const connection = await getConnection();
            const [results] = await connection.execute('SELECT * FROM situations WHERE user = ?', [user]);

            let situations = results.map((situationObj) => {
                let parsedSituationJson = JSON.parse(situationObj.json);
                return { ...parsedSituationJson, id: situationObj.id };
            });

            socket.emit('Situations', situations);
        } catch (error) {
            console.error('Error querying the database:', error);
            // Gérez l'erreur comme vous le souhaitez, peut-être envoyer une réponse au client également
            // socket.emit('Error', 'An error occurred while fetching situations');  // Vous pouvez ajuster ce message d'erreur selon vos besoins
        }
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
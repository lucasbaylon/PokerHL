const express = require('express');
cors = require('cors');
const app = express();

const JSZip = require('jszip');
const multer = require('multer');

const admin = require('firebase-admin');

const { getConnection } = require('./database');

const http = require('http').Server(app);

const serviceAccount = require('./serviceAccountKey.json');

// Configuration de multer pour le stockage en mémoire
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

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

protectedRouter.get("/check_situations_for_user/:user", async function (req, res) {
    const user = req.params.user;
    try {
        const connection = await getConnection();
        const [results] = await connection.execute('SELECT * FROM situations WHERE user = ?', [user]);

        if (results.length === 0) {
            res.status(200).json({ authorized: false, message: "NO_SITUATION" });
        } else {
            res.status(200).json({ authorized: true, message: "OK" });
        }
    } catch (error) {
        console.error('Error querying the database:', error);
        // En cas d'erreur, envoyez une réponse 500 au client
        // res.status(500).json({ error: 'An error occurred while checking the situation name' });
    }
});

protectedRouter.get("/check_change_situation_name/:id/:new_situation_name/:user", async function (req, res) {
    const id = req.params.id;
    const new_situation_name = req.params.new_situation_name;
    const user = req.params.user;

    try {
        const connection = await getConnection();
        const [results] = await connection.execute('SELECT * FROM situations WHERE id != ? AND user = ?', [id, user]);

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

protectedRouter.get("/export_situation/:user", async function (req, res) {
    let user = req.params.user;

    try {
        const connection = await getConnection();
        const [results] = await connection.execute('SELECT * FROM situations WHERE user = ?', [user]);

        const zip = new JSZip();

        results.forEach((obj) => {
            const jsonObj = JSON.parse(obj.json);
            zip.file(`${jsonObj.name}.json`, obj.json);
        });

        zip.generateAsync({ type: 'nodebuffer' }).then(function (content) {
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', 'attachment; filename=situations.zip');
            res.send(content);
        });
    } catch (error) {
        console.error('Erreur lors de la création du fichier ZIP:', err);
        res.status(500).send('Erreur du serveur');
    }
});

protectedRouter.post("/import_situation/:user", upload.single('file'), async function (req, res) {
    let user = req.params.user;

    if (!req.file) {
        return res.status(400).send('Aucun fichier n\'a été téléchargé.');
    }

    // Récupérer le buffer contenant le contenu du fichier ZIP
    const zipBuffer = req.file.buffer;

    // Utiliser JSZip pour lire le contenu du ZIP à partir du buffer
    JSZip.loadAsync(zipBuffer)
        .then(zip => {
            // Traiter chaque fichier contenu dans le ZIP
            const jsonFilesPromises = Object.keys(zip.files).filter(fileName => {
                // Filtrer pour obtenir uniquement les fichiers .json
                return fileName.endsWith('.json');
            }).map(fileName => {
                // Extraire le contenu des fichiers .json
                return zip.file(fileName).async('string').then(content => {
                    // console.log(JSON.parse(content));
                    // Faire quelque chose avec le contenu JSON
                    // console.log(`Contenu du fichier ${fileName}:`, content);
                    return { fileName, content }; // Retourner le contenu sous forme d'objet
                });
            });

            // Attendre que tous les fichiers JSON soient traités
            return Promise.all(jsonFilesPromises);
        })
        .then(async (filesContents) => {
            // Tous les contenus de fichiers JSON sont maintenant dans filesContents
            // Vous pouvez maintenant répondre à la requête ou effectuer d'autres actions
            // res.json(filesContents.length);
            // Assurez-vous d'abord d'avoir une instance de connexion à la base de données
            const connection = await getConnection();

            try {
                // Démarrez une transaction
                await connection.beginTransaction();

                // Insérez chaque contenu de fichier en base de données
                for (const content of filesContents) {
                    // Votre logique d'insertion ici
                    await connection.execute('INSERT INTO situations (json, user) VALUES (?, ?)', [content.content, user]);
                }

                // Validez la transaction si tout est en ordre
                await connection.commit();

                // Répondez à la requête HTTP
                res.json({ success: true, count: filesContents.length });
            } catch (error) {
                // Si une erreur survient, annulez la transaction
                await connection.rollback();

                // Log et réponse d'erreur
                console.error('Erreur lors de l\'insertion des données:', error);
                res.status(500).json({ success: false, message: 'Erreur lors de l\'insertion des données' });
            }
        })
        .catch(err => {
            console.error('Erreur lors de la lecture du fichier ZIP:', err);
            res.status(500).send('Erreur lors de la lecture du fichier ZIP.');
        });
});

app.use('/api', protectedRouter);

if (process.env.NODE_ENV !== 'dev') {
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

    socket.on('EditSituation', async (data) => {
        const situation = data.data;
        const situation_id = situation.id;

        delete situation.id;

        try {
            const connection = await getConnection();

            await connection.execute("UPDATE situations SET json = ? WHERE id = ?", [JSON.stringify(situation), situation_id], function (error, results, fields) {
                if (error) throw error;
                console.log('Ligne mise à jour avec ID:', data.id);
                console.log('Nombre de lignes affectées:', results.affectedRows);
            });
        } catch (error) {
            console.error('An error occurred:', error);
            // socket.emit('Error', 'An error occurred while updating the situation.');
        }
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

    socket.on('GetSituation', async (id) => {
        const connection = await getConnection();
        const [results] = await connection.execute('SELECT * FROM situations WHERE id = ?', [id]);
        let parsedSituationJson = JSON.parse(results[0].json);
        const situationObj = { id: results[0].id, ...parsedSituationJson };
        socket.emit('Situation', JSON.stringify(situationObj));
    });
});

http.listen(3000, () => {
    console.log('listening on http://localhost:3000');
});
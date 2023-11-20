const express = require('express');
cors = require('cors');
const app = express();

const path = require('path');
const fs = require('fs');
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
    let connection;
    try {
        connection = await getConnection();
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
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

protectedRouter.get("/check_change_situation_name/:id/:new_situation_name/:user", async function (req, res) {
    const id = req.params.id;
    const new_situation_name = req.params.new_situation_name;
    const user = req.params.user;
    let connection;

    try {
        connection = await getConnection();
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
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

protectedRouter.get("/check_situation_name/:new_situation_name/:user", async function (req, res) {
    let new_situation_name = req.params.new_situation_name;
    let user = req.params.user;
    let connection;

    try {
        connection = await getConnection();
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
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

protectedRouter.get("/export_situation/:user", async function (req, res) {
    let user = req.params.user;
    let connection;

    try {
        connection = await getConnection();
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
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

protectedRouter.post("/import_zip_situation", upload.single('file'), async function (req, res) {
    const user = req.body.user;

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

            // Vérifier que les fichiers JSON sont valides
            for (const fileContent of filesContents) {
                const validationResult = validateJsonContent(fileContent.fileName, fileContent.content);

                console.log(validationResult);

                if (!validationResult.isValid) {
                    return res.status(400).json({ success: false, message: validationResult.message, errors: validationResult.errors });
                }
            }

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

protectedRouter.post("/import_json_situation", upload.single('file'), async function (req, res) {
    const user = req.body.user;
    const fileName = req.body.fileName;

    if (!req.file) {
        return res.status(400).send('Aucun fichier n\'a été téléchargé.');
    }

    // Récupérer le contenu du fichier JSON
    const jsonContent = req.file.buffer.toString();

    let connection;

    try {
        const validationResult = validateJsonContent(fileName, jsonContent);

        if (!validationResult.isValid) {
            return res.status(400).json({ success: false, message: validationResult.message, errors: validationResult.errors });
        }

        connection = await getConnection();

        try {
            await connection.execute('INSERT INTO situations (json, user) VALUES (?, ?)', [jsonContent, user]);

            // Répondez à la requête HTTP
            res.json({ success: true });
        } catch (error) {

            // Log et réponse d'erreur
            console.error('Erreur lors de l\'insertion des données:', error);
            res.status(500).json({ success: false, message: 'Erreur lors de l\'insertion des données' });
        }
    } catch (error) {
        console.error('Erreur lors de la lecture ou du traitement du fichier JSON:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la lecture ou du traitement du fichier JSON' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

function validateJsonContent(fileName, jsonContent) {
    try {
        const jsonData = JSON.parse(jsonContent);

        const champsValides = ["name", "nbPlayer", "dealerMissingTokens", "dealer", "opponentLevel", "actions", "situations"];

        // Vérifiez que tous les champs requis sont présents et qu'aucun champ supplémentaire n'est présent
        const champsJson = Object.keys(jsonData);
        const isChampManquant = champsValides.some(champ => !champsJson.includes(champ));
        const isChampInvalide = champsJson.some(champ => !champsValides.includes(champ));

        if (isChampManquant) {
            return {
                isValid: false,
                message: `Il manque un ou plusieurs champs requis dans le fichier ${fileName}.`
            };
        }

        if (isChampInvalide) {
            return {
                isValid: false,
                message: `Le fichier ${fileName} contient des champs non attendus.`
            };
        }

        const validations = {
            name: val => typeof val === 'string',
            nbPlayer: val => typeof val === 'number' && (val === 2 || val === 3),
            dealerMissingTokens: val => typeof val === 'number',
            dealer: val => typeof val === 'string' && ['you', 'opponent1', 'opponent2'].includes(val),
            opponentLevel: val => typeof val === 'string' && ['fish', 'shark'].includes(val),
        };

        for (const [key, validator] of Object.entries(validations)) {
            if (!validator(jsonData[key])) {
                return {
                    isValid: false,
                    message: `Le champ '${key}' est invalide dans le fichier ${fileName}.`
                };
            }
        }

        // Validation spécifique pour le champ 'actions'
        if (!Array.isArray(jsonData.actions)) {
            return {
                isValid: false,
                message: `Le champ 'actions' doit être un tableau dans le fichier ${fileName}.`
            };
        }

        const actionErrors = [];
        jsonData.actions.forEach((action, index) => {
            if (!/^(unique_action_|mixed_action_)\d+$/.test(action.id)) {
                actionErrors.push(`Action ${index}: 'id' invalide.`);
            }

            if (!['unique', 'mixed'].includes(action.type)) {
                actionErrors.push(`Action ${index}: 'type' invalide.`);
            }

            if (typeof action.display_name !== 'string') {
                actionErrors.push(`Action ${index}: 'display_name' doit être une chaîne de caractères.`);
            }

            if (typeof action.color === 'string') {
                if (!/^#[0-9A-Fa-f]{6}$/.test(action.color)) {
                    actionErrors.push(`Action ${index}: 'color' doit être au format hexadécimal.`);
                }
            } else if (Array.isArray(action.colorList)) {
                action.colorList.forEach((colorItem, colorIndex) => {
                    if (!/^unique_action_\d+$/.test(colorItem.color)) {
                        actionErrors.push(`Action ${index}, Color ${colorIndex}: 'color' invalide.`);
                    }
                    if (typeof colorItem.percent !== 'number' || colorItem.percent < 0 || colorItem.percent > 100) {
                        actionErrors.push(`Action ${index}, Color ${colorIndex}: 'percent' doit être un nombre entre 0 et 100.`);
                    }
                });
            } else {
                actionErrors.push(`Action ${index}: doit avoir un 'color' hexadécimal ou une 'colorList'.`);
            }
        });

        if (actionErrors.length > 0) {
            return {
                isValid: false,
                message: `Erreurs détectées dans le champ 'actions' du fichier ${fileName}`,
                errors: actionErrors
            };
        }

        // Validation spécifique pour le champ 'situations'
        if (!Array.isArray(jsonData.situations) || jsonData.situations.length !== 13) {
            return {
                isValid: false,
                message: `Le champ 'situations' doit être un tableau de 13 éléments dans le fichier ${fileName}.`
            };
        }

        const situationErrors = [];
        jsonData.situations.forEach((situationGroup, groupIndex) => {
            if (!Array.isArray(situationGroup) || situationGroup.length !== 13) {
                situationErrors.push(`Groupe ${groupIndex} dans 'situations' doit être un tableau de 13 éléments dans le fichier ${fileName}.`);
                return;
            }

            situationGroup.forEach((situation, situationIndex) => {
                if (typeof situation.card !== 'string') {
                    situationErrors.push(`Groupe ${groupIndex}, Situation ${situationIndex}: 'card' doit être une chaîne de caractères.`);
                }
                if (!/^(unique_action_|mixed_action_)\d+$/.test(situation.action)) {
                    situationErrors.push(`Groupe ${groupIndex}, Situation ${situationIndex}: 'action' invalide.`);
                }
            });
        });

        if (situationErrors.length > 0) {
            return {
                isValid: false,
                message: `Erreurs détectées dans le champ 'situations' pour le fichier ${fileName}`,
                errors: situationErrors
            };
        }

        // Si tout est valide
        return { isValid: true };
    } catch (error) {
        console.error('Erreur lors de la validation du JSON:', error);
        // Retourner un objet indiquant une erreur avec le message
        return {
            isValid: false,
            message: 'Le fichier fourni n\'est pas un JSON valide ou contient des erreurs.'
        };
    }
}

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

        let connection;

        try {
            connection = await getConnection();

            await connection.execute("INSERT INTO situations (json, user) VALUES (?, ?)", [json, data.user], function (error, results, fields) {
                if (error) throw error;
                console.log('Ligne insérée avec ID:', results.insertId);
            });
        } catch (error) {
            console.error('An error occurred:', error);
            // socket.emit('Error', 'An error occurred while duplicating the situation.');
        } finally {
            if (connection) {
                connection.release();
            }
        }
    });

    socket.on('EditSituation', async (data) => {
        const situation = data.data;
        const situation_id = situation.id;

        delete situation.id;

        let connection;

        try {
            connection = await getConnection();

            await connection.execute("UPDATE situations SET json = ? WHERE id = ?", [JSON.stringify(situation), situation_id], function (error, results, fields) {
                if (error) throw error;
                console.log('Ligne mise à jour avec ID:', data.id);
                console.log('Nombre de lignes affectées:', results.affectedRows);
            });
        } catch (error) {
            console.error('An error occurred:', error);
            // socket.emit('Error', 'An error occurred while updating the situation.');
        } finally {
            if (connection) {
                connection.release();
            }
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
        let connection;
        try {
            connection = await getConnection();
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
        } finally {
            if (connection) {
                connection.release();
            }
        }
    });

    socket.on('GetSituation', async (id) => {
        let connection;
        try {
            connection = await getConnection();
            const [results] = await connection.execute('SELECT * FROM situations WHERE id = ?', [id]);
            let parsedSituationJson = JSON.parse(results[0].json);
            const situationObj = { id: results[0].id, ...parsedSituationJson };
            socket.emit('Situation', JSON.stringify(situationObj));
        } catch (error) {
            console.error('Error querying the database:', error);
        } finally {
            if (connection) {
                connection.release();
            }
        }
    });
});

http.listen(3000, () => {
    console.log('listening on http://localhost:3000');
});
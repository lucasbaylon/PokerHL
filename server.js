var express = require("express");
var bodyParser = require("body-parser");

const fs = require('fs')

// Create new instance of the express server
var app = express();

// Define the JSON parser as a default way 
// to consume and produce data through the 
// exposed APIs
app.use(bodyParser.json());

// Create link to Angular build directory
// The `ng build` command will save the result
// under the `dist` folder.
var distDir = __dirname + "/dist/";
app.use(express.static(distDir));

// Init the server
var server = app.listen(3000, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
});

/*  "/api/status"
 *   GET: Get server status
 *   PS: it's just an example, not mandatory
 */
app.get("/api/status", function (req, res) {
    res.status(200).json({ status: "UP" });
});

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
    // res.status(200).json("test");
});

app.get("/api/create_situation", function (req, res) {
    let situations_dir = './situations'
    let cards = [
        ["AA", "AKs", "AQs", "AJs", "ATs", "A9s", "A8s", "A7s", "A6s", "A5s", "A4s", "A3s", "A2s"],
        ["AKo", "KK", "KQs", "KJs", "KTs", "K9s", "K8s", "K7s", "K6s", "K5s", "K4s", "K3s", "K2s"],
        ["AQo", "KQo", "QQ", "QJs", "QTs", "Q9s", "Q8s", "Q7s", "Q6s", "Q5s", "Q4s", "Q3s", "Q2s"],
        ["AJo", "KJo", "QJo", "JJ", "JTs", "J9s", "J8s", "J7s", "J6s", "J5s", "J4s", "J3s", "J2s"],
        ["ATo", "KTo", "QTo", "JTo", "TT", "T9s", "T8s", "T7s", "T6s", "T5s", "T4s", "T3s", "T2s"],
        ["A9o", "K9o", "Q9o", "J9o", "T9o", "99", "98s", "97s", "96s", "95s", "94s", "93s", "92s"],
        ["A8o", "K8o", "Q8o", "J8o", "T8o", "98o", "88", "87s", "86s", "85s", "84s", "83s", "82s"],
        ["A7o", "K7o", "Q7o", "J7o", "T7o", "97o", "87o", "77", "76s", "75s", "74s", "73s", "72s"],
        ["A6o", "K6o", "Q6o", "J6o", "T6o", "96o", "86o", "76o", "66", "65s", "64s", "63s", "62s"],
        ["A5o", "K5o", "Q5o", "J5o", "T5o", "95o", "85o", "75o", "65o", "55", "54s", "53s", "52s"],
        ["A4o", "K4o", "Q4o", "J4o", "T4o", "94o", "84o", "74o", "64o", "54o", "44", "43s", "42s"],
        ["A3o", "K3o", "Q3o", "J3o", "T3o", "93o", "83o", "73o", "63o", "53o", "43o", "33", "32s"],
        ["A2o", "K2o", "Q2o", "J2o", "T2o", "92o", "82o", "72o", "62o", "52o", "42o", "32o", "22"]
    ]

    let situation = []

    cards.map(row => {
        let row_obj = {}
        row.map(card => row_obj[card] = "")
        situation.push(row_obj)
    })
    console.log(situation)

    let new_obj = {
        actions: [],
        situations: situation
    }
    let json = JSON.stringify(new_obj);
    fs.writeFile(situations_dir + '/situation_x.json', json, 'utf8', (err) => {
        if (err) return console.log(err);
        console.log('Situation créer !');
    });
    res.status(200).json({ status: "OK" });
});
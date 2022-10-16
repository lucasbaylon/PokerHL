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
        fs.readdir(situations_dir, function(err, data) {
            if (data.length == 0) {
                console.log("Directory is empty!");
                res.status(200).json({authorized: false, message: "DIRECTORY_EMPTY"});
            } else {
                console.log("Directory is not empty!");
                res.status(200).json({authorized: true, message: "OK"});
            }
        });
      } else {
        console.log('Directory not found.')
        res.status(200).json({authorized: false, message: "DIRECTORY_NOT_FOUND"});
      }
    // res.status(200).json("test");
});
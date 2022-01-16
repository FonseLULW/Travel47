// requires
const express = require("express");
const session = require("express-session");
const app = express();
const fs = require('fs');
const { JSDOM } = require('jsdom');

// use functions
app.use("/js", express.static("public/js"));
app.use("/css", express.static("public/css"));
app.use("/img", express.static("public/img"));
app.use("/html", express.static("app/html"));
app.use("/fonts", express.static("public/fonts"));

// session
app.use(session(
  {
      secret:"extra text that no one will guess",
      name:"wazaSessionID",
      resave: false,
      saveUninitialized: true })
);

// display landing page of the app
app.get("/", function (req, res){
    let doc = fs.readFileSync("./app/html/login.html", "utf8");
    res.send(doc);
});

app.get("/profile", function(req, res) {

  // check for a session first!
  if(req.session.loggedIn) {

        let profile = fs.readFileSync("./app/html/profile.html", "utf8");
        let profileDOM = new JSDOM(profile);

      // great time to get the user's data and put it into the page!

        profileDOM.window.document.getElementById("username").innerHTML
            = req.session.name;
        profileDOM.window.document.getElementById("useremail").innerHTML
            = req.session.email;
        profileDOM.window.document.getElementById("usercodename").innerHTML
            = req.session.codename;
        profileDOM.window.document.getElementById("usergender").innerHTML
            = req.session.gender;
        profileDOM.window.document.getElementById("userage").innerHTML
            = req.session.age;
        profileDOM.window.document.getElementById("usermiles").innerHTML
            = req.session.credit;

        profileDOM.window.document.getElementById("dest1url").setAttribute("src", "/img/" + req.session.dest1.imgURL + ".jpg");
        profileDOM.window.document.getElementById("dest1name").innerHTML
            = req.session.dest1.name;
        profileDOM.window.document.getElementById("dest1location").innerHTML
            = req.session.dest1.location;
        profileDOM.window.document.getElementById("dest1lang").innerHTML
            = req.session.dest1.primaryLanguage;
        profileDOM.window.document.getElementById("dest1size").innerHTML
            = req.session.dest1.crowdSize;
        profileDOM.window.document.getElementById("dest1visa").innerHTML
            = Boolean(req.session.dest1.VISAneeded);
        profileDOM.window.document.getElementById("dest1currency").innerHTML
            = req.session.dest1.currencyUsed;

        profileDOM.window.document.getElementById("dest2url").setAttribute("src", "/img/" + req.session.dest2.imgURL + ".jpg");
        profileDOM.window.document.getElementById("dest2name").innerHTML
            = req.session.dest2.name;
        profileDOM.window.document.getElementById("dest2location").innerHTML
            = req.session.dest2.location;
        profileDOM.window.document.getElementById("dest2lang").innerHTML
            = req.session.dest2.primaryLanguage;
        profileDOM.window.document.getElementById("dest2size").innerHTML
            = req.session.dest2.crowdSize;
        profileDOM.window.document.getElementById("dest2visa").innerHTML
            = Boolean(req.session.dest2.VISAneeded);
        profileDOM.window.document.getElementById("dest2currency").innerHTML
            = req.session.dest2.currencyUsed;

                profileDOM.window.document.getElementById("dest3url").setAttribute("src", "/img/" + req.session.dest3.imgURL + ".jpg");
        profileDOM.window.document.getElementById("dest3name").innerHTML
            = req.session.dest3.name;
        profileDOM.window.document.getElementById("dest3location").innerHTML
            = req.session.dest3.location;
        profileDOM.window.document.getElementById("dest3lang").innerHTML
            = req.session.dest3.primaryLanguage;
        profileDOM.window.document.getElementById("dest3size").innerHTML
            = req.session.dest3.crowdSize;
        profileDOM.window.document.getElementById("dest3visa").innerHTML
            = Boolean(req.session.dest3.VISAneeded);
        profileDOM.window.document.getElementById("dest3currency").innerHTML
            = req.session.dest3.currencyUsed;


        res.set("Server", "Wazubi Engine");
        res.set("X-Powered-By", "Wazubi");
        res.send(profileDOM.serialize());

  } else {
      // not logged in - no session and no access, redirect to home!
      res.redirect("/");
  }

});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// LOGIN
app.post("/login", function(req, res) {
  res.setHeader("Content-Type", "application/json");


  console.log("What was sent", req.body.email, req.body.password);


  authenticate(req.body.email, req.body.password,
      function(userRecord) {
          //console.log(rows);
          if(userRecord == null) {
              res.send({ status: "fail", msg: "User account not found." });
          } else {
              req.session.loggedIn = true;

              req.session.email = userRecord.email;
              req.session.name = userRecord.name;
              req.session.credit = userRecord.credit;
              req.session.codename = userRecord.codename;
              req.session.gender = userRecord.gender;
              req.session.age = userRecord.age;

              req.session.save(function(err) {
              });
          }
  });

  getDestinations(function(destinationsRecord){
    if(destinationsRecord == null){
        res.send({ status: "fail", msg: "Destinations table not found." });
    } else {
        req.session.dest1 = destinationsRecord[0]
        req.session.dest2 = destinationsRecord[1]
        req.session.dest3 = destinationsRecord[2]

        req.session.save(function(err) {
        });
    }
  });
  res.send({ status: "success", msg: "Logged in." });

});

// LOGOUT
app.get("/logout", function(req,res){

    if (req.session) {
        req.session.destroy(function(error) {
            if (error) {
                res.status(400).send("Unable to log out")
            } else {
                // session deleted, redirect to home
                res.redirect("/");
            }
        });
    }
});

// LOGIN AUTHENTICATION
function authenticate(email, pwd, callback) {

  const mysql = require("mysql2");
  const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "travel47"
  });
  connection.connect();
  connection.query(
    //'SELECT * FROM user',
    "SELECT * FROM user WHERE email = ? AND password = ?", [email, pwd],
    function(error, results, fields) {
        // results is an array of records, in JSON format
        // fields contains extra meta data about results
        console.log("Results from DB", results, "and the # of records returned", results.length);

        if (error) {
            // in production, you'd really want to send an email to admin but for now, just console
            console.log(error);
        }
        if(results.length > 0) {
            // email and password found
            return callback(results[0]);
        } else {
            // user not found
            return callback(null);
        }
    });
}

function getDestinations(callback){
    const mysql = require("mysql2");
    const connection = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "travel47"
    });
    connection.connect();
    connection.query("SELECT * FROM destinations", [],
        function(error, results, fields){
            console.log("Results from DB", results, "and the # of records returned", results.length);
            if (error) {
                console.log(error);
            }
            if(results.length > 0) {
                return callback(results);
            } else {
                return callback(null);
            }
        });
}

// RUN SERVER
async function init() {

    // we'll go over promises in COMP 2537, for now know that it allows us
    // to execute some code in a synchronous manner
    const mysql = require("mysql2/promise");
    const connection = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      multipleStatements: true
    });
    const createDBAndTables = `CREATE DATABASE IF NOT EXISTS travel47;
        use travel47;
        CREATE TABLE IF NOT EXISTS user (
        ID int NOT NULL AUTO_INCREMENT,
        name varchar(30),
        email varchar(30),
        password varchar(30),
        credit int,
        codename varchar(30),
        gender varchar(30),
        age int,
        PRIMARY KEY (ID));`;
    await connection.query(createDBAndTables);

    const createDestDBAndTables = `CREATE TABLE IF NOT EXISTS destinations (
        ID int NOT NULL AUTO_INCREMENT,
        name varchar(30),
        location varchar(30),
        primaryLanguage varchar(30),
        crowdSize varchar(30),
        VISAneeded bool,
        currencyUsed varchar(30),
        imgURL varchar(50),
        PRIMARY KEY (ID));`;
    await connection.query(createDestDBAndTables);
    const [rows, fields] = await connection.query("SELECT * FROM user");
    if(rows.length == 0) {
        let userRecords = "insert into user (name, email, password, credit, codename, gender, age) values ?";
        let recordValues = [
          ["47", "agent47@google.ca", "HITMAN", 47000, "Silent Assassin", "Male", 47],
          ["Viktor", "viktor_novikov@google.ca", "Dalia", 100000, "The Moneyman", "Male", 34],
          ["Silvio", "silvio_caruso@google.ca", "providence", 4500, "The Virus", "Male", 27]
        ];
        await connection.query(userRecords, [recordValues]);
    }

    const [destRows, destFields] = await connection.query("SELECT * FROM destinations");
    if(destRows.length == 0) {
        let destRecords = "insert into destinations (name, location, primaryLanguage, crowdSize, VISAneeded, currencyUsed, imgURL) values ?";
        let recordDestValues = [
          ["Himmapan Hotel", "Bangkok, Thailand", "Thai", "medium", true, "Baht", "himmapanURL"],
          ["Palais de Walewska", "Paris, France", "French", "heavy", true, "Euro", "sanguineURL"],
          ["Villa Caruso", "Sapienza, Italy", "Italian", "light", true, "Euro", "amalfiURL"]
        ];
        await connection.query(destRecords, [recordDestValues]);
    }


    console.log("Listening on port " + port + "!");
}

let port = 8000;
app.listen(port, init);
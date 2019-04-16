const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;
const pg = require("pg");




app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);


app.post("/sendReading", (req, resp) => {
    const dbClient = new pg.Client({
        user: 'iotproject',
        host: 'localhost', //todo: localhost
        database: 'iotfinal',
        port: 5432,
    });
    dbClient.connect();

    console.log(req.body);

    let degrees = req.body.degrees;
    let host = req.body.host;
    let humidity = req.body.humidity;

    if(!degrees || !host) {
        resp.status(400).send("degrees or source not supplied!")
    }
    else {
        let query = "INSERT INTO temperatures(degrees, source, timestamp) VALUES($1, (select id from sources where name=$2), NOW())";
        let params = [degrees, host];

        dbClient.query(query, params, (err, res) => {

            if ( humidity ) {
                let humidity_query = "INSERT INTO humidities(percentage, source, timestamp) VALUES($1, (select id from sources where name=$2), NOW())";
                let humidity_params = [degrees, host];

                dbClient.query(humidity_query, humidity_params, (err, res) => {
                    dbClient.end();
                });
            }

            resp.send('OK!');
            dbClient.end();
        });

    }
});


app.listen(port, () => {
    console.log(`App running on port ${port}.`)
});
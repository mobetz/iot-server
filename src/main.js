const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;
const pg = require("pg");

const dbConfig = require("./dbConfig.json");

function getDbClient() {
    const dbClient = new pg.Client(dbConfig);
    dbClient.connect();
    return dbClient;
}


app.use(express.static('static'));

app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);

app.get("/sources", (req, resp) => {
    const dbClient = getDbClient();

    const query = "SELECT s.* FROM sources s";
    dbClient.query(query, (err, res) => {
        resp.send(res.rows);
    });

});

app.get("/readings/temperatures", (req, resp) => {
    const dbClient = getDbClient();

    const query = "SELECT t.* FROM temperatures t ORDER BY timestamp desc";
    dbClient.query(query, (err, res) => {
       resp.send(res.rows);
       dbClient.end();
    });

});

app.get("/readings/humidities", (req, resp) => {
    const dbClient = getDbClient();

    const query = "SELECT h.* from humidities h ORDER BY timestamp desc";
    dbClient.query(query, (err, res) => {
	    resp.send(res.rows);
        dbClient.end();
    });

});


app.post("/readings", (req, resp) => {
    const dbClient = getDbClient();

    console.log(req.body);

    let degrees = req.body.degrees;
    let host = req.body.host;
    let humidity = req.body.humidity;

    if(!degrees || !host) {
        resp.status(400).send("degrees or host not supplied!")
    }
    else {
        let query = "INSERT INTO temperatures(degrees, source, timestamp) VALUES($1, (select id from sources where name=$2), NOW())";
        let params = [degrees, host];

        dbClient.query(query, params, (err, res) => {

            if ( humidity ) {
                let humidity_query = "INSERT INTO humidities(percentage, source, timestamp) VALUES($1, (select id from sources where name=$2), NOW())";
                let humidity_params = [humidity, host];

                dbClient.query(humidity_query, humidity_params, (err, res) => {
                    resp.send('Reading Added!');
                    dbClient.end();
                });
            }
            else {
                resp.send('Reading Added!');
                dbClient.end();
            }
        });

    }
});

app.delete('/readings', (req, resp) => {

    const dbClient = getDbClient();

    dbClient.query("DELETE FROM temperatures", (err, res) => {
        dbClient.query("DELETE FROM humidities", (err, res) => {
           resp.send("All data deleted");
           dbClient.end()
        });
    });

});

app.listen(port, () => {
    console.log(`App running on port ${port}.`)
});

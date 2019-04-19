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

function get_sources() {
    return new Promise((resolve, reject) => {
        const dbClient = getDbClient();

        const query = "SELECT s.* FROM sources s";
        dbClient.query(query, (err, res) => {
            resolve(res.rows);
            dbClient.end();
        });
    })
}

app.get("/sources", (req, resp) => {
    get_sources().then((sources) => resp.send(sources));
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
    let host = req.body.sensor_id;
    let humidity = req.body.humidity;


    if (!degrees || !host) {
        resp.status(400).send("degrees or sensor_id not supplied!")
    } else {
        get_sources()
            .then((sources_list) => {
                return sources_list.reduce((dict, s) => {
                    dict[s.name] = s.id;
                    return dict;
                }, {});

            })
            .then((sources_dict) => {
                if (!sources_dict.hasOwnProperty(host)) {
                    return dbClient.query("INSERT INTO sources(name) VALUES($1)", [host]);
                }
            })
            .then(() => {
                let query = "INSERT INTO temperatures(degrees, source, timestamp) VALUES($1, (select id from sources where name=$2), NOW())";
                let params = [degrees, host];

                return dbClient.query(query, params);
            })
            .then(() => {
                if (humidity) {
                    let humidity_query = "INSERT INTO humidities(percentage, source, timestamp) VALUES($1, (select id from sources where name=$2), NOW())";
                    let humidity_params = [humidity, host];

                    return dbClient.query(humidity_query, humidity_params);
                }
            })
            .then(() => {
                resp.send('Reading Added!');
                dbClient.end();
            })
            .catch((e) => {
                console.log(e);
                resp.status(400).send(e);
                dbClient.end();

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


class SourcePlot {
    constructor(id, datatype) {
        this.id = id;
        this.x = [];
        this.y = [];
        this.type = 'scatter';
        this.fill = 'tozeroy';
        this.yaxis = (datatype === "temp") ? 'y1' : 'y2';
        this.name = id + " " + datatype;
    }

    add_reading(x,y) {
        this.x.push(x);
        this.y.push(y);
    }
}

function response_to_json(resp) {
    if (resp.status !== 200) {
        throw new Error("Fetch failed!")
    }
    return resp.json()
}

function split_readings_to_source_plots(readings, datatype) {

    let source_plots = {};

    readings.forEach((reading) => {
        if (!source_plots.hasOwnProperty(reading.name)) {
            source_plots[reading.name] = new SourcePlot(reading.name, datatype);
        }

        let x = new Date(reading.timestamp);
        let y = (reading.hasOwnProperty("degrees")) ? Number.parseFloat(reading.degrees) : reading.percentage;
        source_plots[reading.name].add_reading(x, y);
    });

    return Object.values(source_plots);
}

const MS_PER_SEC = 1000;
const SEC_PER_MIN = 60;
const MINS_PER_HOUR = 60;

const initial_range = {};

function build_graph(data, graphname) {

    let now = Date.now(); //+ 4 * MINS_PER_HOUR * SEC_PER_MIN * MS_PER_SEC;

    let base_layout = {
        yaxis: {
            title: 'Temperature (F)',
            titlefont: {color: '#1f77b4'},
            tickfont: {color: '#1f77b4'}
        },
        yaxis2: {
            title: 'Humidity (%)',
            titlefont: {color: '#1f77b4'},
            tickfont: {color: '#1f77b4'}
        },
        xaxis: {
            range: [now - 10 * SEC_PER_MIN * MS_PER_SEC, now]
        },
        dragmode: 'pan',
        showlegend: true
    };

    let graph_obj = document.getElementById(graphname);
    let layout;


    if ( !graph_obj.changed ) {
        layout = base_layout;
    }
    else {
        layout = graph_obj.layout;
    }


    Plotly.react(graphname, data, layout);
}

function fetchReadings() {
    let tempsPromise = fetch('/readings/temperatures')
        .then(response_to_json)
        .then((r) => split_readings_to_source_plots(r, "temp"))
        .then((r) => build_graph(r, "temp_graph"));
    let humidsPromise = fetch('/readings/humidities')
        .then(response_to_json)
        .then((r) => split_readings_to_source_plots(r, "hum"))
        .then((r) => build_graph(r, "hum_graph"));

}

window.addEventListener('load', ()=> {

    let reset_button = document.getElementById('reset');
    reset.addEventListener('click', (ev) => {
        fetch('/readings', {
            method: 'DELETE'
        });
    });

    let scroll_button = document.getElementById('scrollbutton');
    scroll_button.addEventListener('click', (ev) => {
        document.getElementById('temp_graph').changed = false;
        document.getElementById('hum_graph').changed = false;
    });

    setInterval(fetchReadings, 1000);


});
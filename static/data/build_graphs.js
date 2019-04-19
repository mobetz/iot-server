
class SourcePlot {
    constructor(id, datatype) {
        this.id = id;
        this.x = [];
        this.y = [];
        this.type = 'scatter';
        this.fill = 'tozeroy';
        this.yaxis = (datatype === "temp") ? 'y1' : 'y2';
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
        if (!source_plots.hasOwnProperty(reading.source)) {
            source_plots[reading.source] = new SourcePlot(reading.source, datatype);
        }

        let x = new Date(reading.timestamp);
        let y = (reading.hasOwnProperty("degrees")) ? Number.parseFloat(reading.degrees) : reading.percentage;
        source_plots[reading.source].add_reading(x, y);
    });

    return source_plots;
}


function source_plots_to_plotly_data(plots) {
    let data = [];

    plots.forEach((plot_collection) => {
       Object.keys(plot_collection).forEach((plotName) => {
           data.push(plot_collection[plotName]);
       });
    });

    return data;
}

function build_graph(data) {
    let layout = {
        yaxis: {
            title: 'Temperature',
            titlefont: {color: '#1f77b4'},
            tickfont: {color: '#1f77b4'}
        },
        yaxis2: {
            title: 'Humidity',
            titlefont: {color: '#ff7f0e'},
            tickfont: {color: '#ff7f0e'},
            anchor: 'free',
            overlaying: 'y',
            side: 'right',
            position: 1015
        }
    };
    Plotly.react('graph', data, layout);
}

function fetchReadings() {
    let tempsPromise = fetch('/readings/temperatures')
        .then(response_to_json)
        .then((r) => split_readings_to_source_plots(r, "temp"));
    let humidsPromise = fetch('/readings/humidities')
        .then(response_to_json)
        .then((r) => split_readings_to_source_plots(r, "hum"));

    return Promise.all([tempsPromise, humidsPromise])
        .then(source_plots_to_plotly_data)
        .then(build_graph);

}

document.addEventListener('DOMContentLoaded', ()=> {

    setInterval(fetchReadings, 1000);
});
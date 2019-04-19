
class SourcePlot {
    constructor(id) {
        this.id = id;
        this.x = [];
        this.y = [];
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

function split_readings_to_source_plots(readings) {

    let source_plots = {};

    readings.forEach((reading) => {
        if (!source_plots.hasOwnProperty(reading.source)) {
            source_plots[reading.source] = new SourcePlot(reading.source);
        }

        let x = new Date(reading.timestamp);
        let y = (reading.hasOwnProperty("degrees")) ? Number.parseFloat(reading.degrees) : reading.percentage;
        source_plots[reading.source].add_reading(x, y);
    });

    console.log(source_plots);

    return source_plots;
}


function fetchReadings() {
    let tempsPromise = fetch('/readings/temperatures')
        .then(response_to_json)
        .then(split_readings_to_source_plots);
    let humidsPromise = fetch('/readings/humidities')
        .then(response_to_json)
        .then(split_readings_to_source_plots);

}

document.addEventListener('onload', ()=> {

});

const WIDTH = 800;
const HEIGHT = 800;
const CIRCLE_RADIUS = 20;



const SCORE_DECAY = 0.4;
const SCORE_ENHANCEMENT = 0.4;
const OPTIMAL_RSSI = -40;
const MAX_RSSI = -90;
const RSSI_DISTANCE_DECAY = 10;
const TARGET_RSSI =  -55;
const TARGET_DIST = 150;
const MS_PER_SEC=1000;
const FRAME_DURATION = () => MS_PER_SEC/document.getElementById("fps").value;


class GraphNode {
    constructor(x,y) {
        this.id = GraphNode.node_counter++;
        this.x = x;
        this.y = y;
        this.neighbors = [];
        this.neighbor_score = 100;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, CIRCLE_RADIUS, 0, 2*Math.PI);
        ctx.setLineDash([]);
        ctx.lineWidth = 3;
        ctx.strokeStyle = "black";
        ctx.fillText(this.id, this.x-5, this.y+5, 20);
        ctx.stroke();


        if (blue_checkbox.checked ) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, TARGET_DIST/*CIRCLE_RADIUS + RSSI_DISTANCE_DECAY * (OPTIMAL_RSSI - TARGET_RSSI)*/, 0, 2 * Math.PI);
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = "blue";
            ctx.stroke();
        }

    }

    findNeighbors(idx, nodes) {
        this.neighbors = [];
        nodes.forEach((n, i) => {
            if (i!==idx) {/*
                let rssi = find_rssi(this, n);
                if (rssi > MAX_RSSI) {
                    this.neighbors.push(n);
                }*/
                let dist = calculate_distance(this.x, this.y, n.x, n.y);
                if (dist < TARGET_DIST ) {
                    this.neighbors.push(n);
                }
            }//if not self
        });//foreach neighbor

        this.neighbor_score = (1-SCORE_DECAY)*this.neighbor_score + SCORE_ENHANCEMENT * calculate_score(this.neighbors, this);
    }

    chooseNeighbor() {
/*
        this.speed = 0;
        this.heading = {x: 0, y: 0};*/
        this.n_x = this.x;
        this.n_y = this.y;
        this.target_neighbor = null;

        this.target_neighbor = neighbor_selection_function(this.neighbors, this);
        let n = this.target_neighbor;

        if (this.target_neighbor) {

            let d = calculate_distance(this.x, this.y, n.x, n.y);
            let r = TARGET_DIST;
            let s =  1.8*((Math.sqrt(3) * r - d)/2);

            let loc_sub = math.subtract([n.x, n.y], [this.x, this.y]);
            let loc_norm = math.norm(loc_sub, 2);

            let new_values = math.add([this.x, this.y], math.multiply(s, (math.divide(loc_sub, loc_norm))));
            this.n_x = new_values[0];
            this.n_y = new_values[1];

            /*
            this.speed = speed_from_rssi(find_rssi(this, this.target_neighbor));
            this.heading = generate_heading_from_pos(this.x, this.y, this.target_neighbor.x, this.target_neighbor.y);*/
            //console.log(`${this.id} is moving relative to ${this.target_neighbor.id} at speed: ${this.speed}`);
        }
    }



    updateLocation() {/*
        let desired_x = this.x + (this.heading.x * this.speed);
        let desired_y = this.y + (this.heading.y * this.speed);*/
        let desired_x = this.n_x;
        let desired_y = this.n_y;
        this.x = Math.max(CIRCLE_RADIUS, Math.min(WIDTH-CIRCLE_RADIUS, desired_x));
        this.y = Math.max(CIRCLE_RADIUS, Math.min(HEIGHT-CIRCLE_RADIUS, desired_y));
    }
}//GraphNode
GraphNode.node_counter = 0;


function bell_curve(x,a,b,c=0) { //a changes the "flatness" of the curve. b changes the "steepness" of the curve. c offsets the center
    return 1 / (1 + Math.abs((x-c) / a)^(2*b))
}


function neighbor_selection_function(neighbors, self) {
    let dimmer_neighbors = neighbors.filter((n) => n.neighbor_score < self.neighbor_score);

    let probabilities = dimmer_neighbors.map((n) => (self.neighbor_score - n.neighbor_score)  );
    let sum_of_probabilities = probabilities.reduce((a,b) => a+b, 0);

    let selection_factor = Math.random() * sum_of_probabilities;
    for (let i=0; i<dimmer_neighbors.length; i++) {
        selection_factor = selection_factor - probabilities[i];
        if (selection_factor < 0) {
            return dimmer_neighbors[i];
        }
    }
    return dimmer_neighbors[neighbors.length-1];
}


function find_rssi(a, b) {
    let dist = calculate_distance(a.x, a.y, b.x, b.y);
    let noise = 0; //(Math.random()*20)+20;
    let rssi = OPTIMAL_RSSI - dist/RSSI_DISTANCE_DECAY + noise;
    return rssi;
}

function generate_nodes(count) {
    let node_list = [];
    let center_x = WIDTH/2;
    let center_y = HEIGHT/2;
    let radius = TARGET_DIST/2;
    for (let i = 0; i < count; i++) {
        let rand_x = Math.floor(Math.random() * radius) + center_x ;
        let rand_y = Math.floor(Math.random() * radius) + center_y;
        node_list.push(new GraphNode(rand_x, rand_y));
    }
    return node_list;
}


function calculate_score(neighbors) {
    let score = 100;
    neighbors.forEach((n) => {
        score = score + Math.cos(n.x)**2 + Math.sin(n.y)**2
    });
    return score;
}

function speed_from_rssi(rssi) {
    return (TARGET_RSSI - rssi) / 2;
}

function calculate_distance(x1, y1, x2, y2) {
    return Math.sqrt((x1-x2)**2 + (y1-y2)**2 )
}

function generate_heading_from_pos(x1, y1, x2, y2) {
    let dist = calculate_distance(x1, y1, x2, y2);
    let zeroed_x = x2-x1;
    let zeroed_y = y2-y1;
    return { x: zeroed_x/dist, y: zeroed_y/dist };
}














/*===== RENDERING FUNCTIONS ===========*/

function draw(ctx, node_list) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); //clear canvas
    node_list.forEach((node) => node.draw(ctx));
}



function update(nodes) {
    nodes.forEach((node, i) => node.findNeighbors(i, nodes));
    nodes.forEach((node) => node.chooseNeighbor());
    nodes.forEach((node) => node.updateLocation());
}



function getRenderLoop(id) {

    GraphNode.node_counter = 0;
    let node_counter = document.getElementById("node_count");
    let nodes = generate_nodes(node_counter.value);
    let c = document.getElementById("viz_frame");
    let ctx = c.getContext("2d");
    return function renderLoop() {
        let this_frame_length = Date.now() - last_frame;
        if ( this_frame_length > FRAME_DURATION() ) {
            last_frame = Date.now();

            draw(ctx, nodes);
            update(nodes);
        }
        if (animation_id === id) {
            requestAnimationFrame(renderLoop);
        }
    }
}

let last_frame = Date.now();
let animation_id = 0;

let blue_checkbox, orange_checkbox;



let rssi_data = [
    [52,50,50,50,50,51,53,55,52,50,52,52,52,52,51,52,52,50,49,53],
    [54,60,56,58,56,58,56,56,57,56,56,55,55,56,55,56,56,56,54,55],
    [65,65,66,63,64,62,63,68,66,61,67,65,64,64,67,63,63,64,64,65],
    [64,62,63,62,63,60,61,64,80,69,66,65,62,62,63,63,64,64,64,64],
    [70,66,65,65,66,69,67,65,69,71,70,66,67,67,65,66,64,64,65,64],
    [70,69,68,72,71,69,69,73,69,68,66,68,69,70,68,69,69,69,68,69],
    [73,73,68,74,74,69,70,68,68,73,73,68,67,67,67,69,66,66,66,65],
    [65,65,65,63,66,65,64,62,64,66,64,65,64,63,64,64,64,64,65,65],
    [72,73,70,68,68,70,67,70,75,69,68,67,68,78,78,66,67,67,65,66],
    [72,70,72,73,74,75,74,76,76,74,72,72,73,76,76,75,75,74,73,72],
    [100,86,100,83,83,83,83,80,87,77,81,82,81,81,81,83,84,80,80],
    [85,85,84,85,85,84,83,84,87,85,86,86,86,88,88,86,84,84],
    [92]
];

document.addEventListener('DOMContentLoaded', function() {

    blue_checkbox = document.getElementById("blue");
    orange_checkbox = document.getElementById("orange");

    let frame = document.getElementById("viz_frame");
    frame.width = WIDTH;
    frame.height = HEIGHT;
    frame.style.border = "1px solid black";

    let reset_button = document.getElementById("reset");

    reset_button.addEventListener("click", (ev) => {
        animation_id = animation_id + 1;
        requestAnimationFrame(getRenderLoop(animation_id));
    });

    let rssi_table = document.getElementById("rssi_measurements");

    rssi_data.forEach((data, i) => {
        let distance = (i+1) * 10;
        if (distance > 100) distance = "100 + " + (distance-100);
        distance = distance + " ft";

        let avg = "-" + Math.floor(math.mean(data)*100)/100 + " dB";
        let packet_loss = (20 - data.length)*5 + "%";

        let row = document.createElement("div");
        row.classList.add('table-row');
        rssi_table.appendChild(row);

        [distance, avg, packet_loss].forEach((cell_contents) => {

            let cell = document.createElement("div");
            cell.classList.add('table-cell');
            cell.innerText = cell_contents;

            row.appendChild(cell);
        })




    })
});

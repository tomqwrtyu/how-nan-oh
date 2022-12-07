import {readTextFile} from "./files/inputFile.js"
import {Layout} from "./Layout.js"
import {ThreeDScene} from "./3D scene.js"
import {plotController} from "./plotUtils.js"

let loop_capture = 0;

// opacity settings
let netCompOpacity = 1.0;
let netAreaOpacity = 1.0;
let maxAreaOpacity = 1.0;
let safetyDistanceOpacity = 0.5;

TwoDScene();

for(let i=0; i<loop_capture; i++){
    window.setTimeout(()=>{
        TwoDScene("./animation/placement_" + i + ".csv",
                  "./animation/pin_" + i + ".csv");
        // 截圖function
        exportSVG('Layout_front', 'generation_front_'+ i + '.svg');
        exportSVG('Layout_back', 'generation_back_'+ i + '.svg');
        
        // 清空畫布
        document.getElementById("Layout_front").innerHTML = "";
        document.getElementById("Layout_back").innerHTML = "";
    }, (i + 1) * 1000);
}

function exportSVG(id, filename) {
    console.log(document.getElementById(id).children[0])
    var svgData = document.getElementById(id).children[0];
    var serializer = new XMLSerializer();
    var source = serializer.serializeToString(svgData);
    var svgUrl = "data:image/svg+xml;charset-utf-8," + encodeURIComponent(source);
    var downloadLink = document.createElement("a");
    downloadLink.download = filename;
    downloadLink.href = svgUrl;

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
 }


export function TwoDScene(placement_path = "./placement.csv", 
                          pin_path = "./pin.csv",
                          preplace_path = "./preplace.csv",
                          net_path = "./net.csv"){
    let placement_data = Placement_ArrayToMap(readTextFile(placement_path));
    let preplace_data = Preplace_ArrayToMap(readTextFile(preplace_path));
    let pin_data = Pin_ArrayToMap(readTextFile(pin_path));
    //let two_pin_net_data = Two_Pin_Net_ArrayToMap(readTextFile("./2-pin net.csv"));
    let net_data = Net_ArrayToMap(readTextFile(net_path));
    let layout = new Layout(placement_data, preplace_data, pin_data, net_data);
    let plot = new plotController(layout, net_data);

    plot.run(netCompOpacity, netAreaOpacity, maxAreaOpacity, safetyDistanceOpacity);
}


export function Placement_ArrayToMap(csv) {
    let mapData = {};
    let component;
    let shift = 0;
    for (let i = 0; i < csv.length; i++) {
        component = csv[i];
        if (component[0] === "T501"){
            mapData[component[0]] = {
                "name": component[0],
                "color": "#"+component[1],
                "size": [24, 22, Number(component[4])],
                "voltage": Number(component[5]),
                "position": [Number(component[6]) + shift, Number(component[7]) + shift],
                "margin": Number(component[8]),
                "angle": Number(component[9]),
                "side": component[10],
                "leftChild": component[11],
                "rightChild": component[12],
            }
        }
        else{
            mapData[component[0]] = {
                "name": component[0],
                "color": "#"+component[1],
                "size": [Number(component[2]), Number(component[3]), Number(component[4])],
                "voltage": Number(component[5]),
                "position": [Number(component[6]) + shift, Number(component[7]) + shift],
                "margin": Number(component[8]),
                "angle": Number(component[9]),
                "side": component[10],
                "leftChild": component[11],
                "rightChild": component[12],
            }
        }
    }
    return mapData;
}

export function Preplace_ArrayToMap(csv) {
    let mapData = {};
    let component;
    let shift = 0;
    for (let i = 0; i < csv.length; i++) {
        component = csv[i];
        if (component[0] === "T501"){
            mapData[component[0]] = {
                "name": component[0],
                "color": "#"+component[1],
                "size": [24, 22, Number(component[4])],
                "voltage": Number(component[5]),
                "position": [Number(component[6]) + shift, Number(component[7]) + shift],
                "margin": Number(component[8]),
                "angle": Number(component[9]),
                "side": component[10],
                "leftChild": component[11],
                "rightChild": component[12],
            }
        }
        else{
            mapData[component[0]] = {
                "name": component[0],
                "color": "#"+component[1],
                "size": [Number(component[2]), Number(component[3]), Number(component[4])],
                "voltage": Number(component[5]),
                "position": [Number(component[6]) + shift, Number(component[7]) + shift],
                "margin": Number(component[8]),
                "angle": Number(component[9]),
                "side": component[10],
                "leftChild": component[11],
                "rightChild": component[12],
            }
        }
    }
    return mapData;
}

function Pin_ArrayToMap(pin_csv) {
    let mapData = {};
    let pin;
    let shift = 0;
    for (let i = 0; i < pin_csv.length; i++) {
        pin = pin_csv[i];
        if (!mapData[pin[0]]) {mapData[pin[0]] = {};}
        mapData[pin[0]][pin[1]] = {
            "name": pin[0] + "-" + pin[1],
            "color": "#666666",
            "size": [Number(pin[2]), Number(pin[3])],
            "position": [Number(pin[4]) + shift, Number(pin[5]) + shift],
            "margin": 0,
        };
    }
    return mapData;
}

// export function Two_Pin_Net_ArrayToMap(csv) {
//     let mapData = {};
//     let row;
//     for (let i = 0; i < csv.length; i++) {
//         row = csv[i];
//         mapData[row[0]] = {
//             "name": row[0],
//             "begin": row[1],
//             "end": row[2],
//         }
//     }
//     return mapData;
// }

function Net_ArrayToMap(csv) {
    let mapData = {};
    let row;
    
    for (let i = 0; i < csv.length; i++) {
        row = csv[i];
        mapData[row[0]] = {
            "name": row[0],
            "component": []
        }
        for (let j = 1; j < row.length; j++) {
            let comp = row[j].split("-");
            mapData[row[0]]["component"][comp[0]] = {"name": comp[0], "pin": comp[1]};
        }
    }
    return mapData;
}
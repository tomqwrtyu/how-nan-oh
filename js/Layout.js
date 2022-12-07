import {readTextFile} from "./files/inputFile.js"
import {Canvas} from "./svg canvas.js";
// import {Scene} from "./3D scene.js";
import {drawTree} from "./drawTree.js"

export class Layout {
    constructor(placement_data, preplace_data, pin_data, net_data) {
        this.component_data = {};
        this.placement_data = placement_data;
        this.preplace_data = preplace_data;
        this.pin_data = pin_data;
        this.net_data = net_data;
        this.pin_in_using = [];

        this.ruleOutUnusedPin();
        this.layout_front = new Canvas("front", {"placement_data": this.placement_data, "preplace_data": this.preplace_data, "pin_data": this.pin_data, "pin_in_using": this.pin_in_using});
        this.layout_back = new Canvas("back", {"placement_data": this.placement_data, "preplace_data": this.preplace_data, "pin_data": this.pin_data, "pin_in_using": this.pin_in_using});

        if (this.layout_front.hasT501){
            //console.log("layout_front.hasT501", this.layout_front.pinT501);
            for(let pinRect of this.layout_front.pinT501){
                this.layout_back.svg.appendChild(pinRect);
            }
        }
        else if (this.layout_back.hasT501){
            //console.log("layout_back.hasT501", this.layout_back.pinT501);
            for(let pinRect of this.layout_back.pinT501){
                this.layout_front.svg.appendChild(pinRect);
            }
        }

        drawTree({divID: 'Tree', width: 1500, height: 800, padding: 50, treeData: MapToTree(this.placement_data, readTextFile("./placement.csv"))});
    }

    // importPlacement(arrData) {
    //     let component;
    //     for (let i = 0; i < arrData.length; i++) {
    //         component = arrData[i];
    //         this.component_data[component[0]] = {
    //             "name": component[0],
    //             "color": "#"+component[1],
    //             "size": [Number(component[2]), Number(component[3]), Number(component[4])],
    //             "voltage": Number(component[5]),
    //             "position": [Number(component[6]), Number(component[7])],
    //             "margin": Number(component[8]),
    //             "angle": Number(component[9]),
    //             "side": component[10],
    //             "leftChild": component[11],
    //             "rightChild": component[12],
    //             "pin_position": {},
    //         }
    //     }
    // }

    // importPin(arrData) {
    //     let pin, name;
    //     for (let i = 0; i < arrData.length; i++) {
    //         pin = arrData[i];
    //         name = pin[0];
    //         if (!this.component_data[name]) {this.component_data[name] = {};}
    //         this.component_data[name][pin[1]] = {
    //             "name": pin[1],
    //             "size": [Number(pin[2]), Number(pin[3])],
    //             "position": [Number(pin[4]), Number(pin[5])],
    //         };
    //     }
    // }

    ruleOutUnusedPin(){
        for (let key in this.net_data){
            for (let compName in this.net_data[key]["component"])
                if (compName === "T501"){
                    this.pin_in_using.push(Number(this.net_data[key]["component"][compName]["pin"]));
                }
        }
        this.pin_in_using.sort((a, b) => {return a - b;});
    }
};

export function MapToTree(mapData, arrData) {
    let Tree = {};
    let queue = [];
    let temp, node, component;

    component = mapData[arrData[0][0]];
    Tree["name"] = component["name"];
    Tree["children"] = [{"name": component["leftChild"]}, {"name": component["rightChild"]}];
    queue.push({"node": Tree["children"][0], "component": mapData[component["leftChild"]]}, {"node": Tree["children"][1], "component": mapData[component["rightChild"]]});
    
    while (queue.length != 0) {
        temp = queue.pop();
        node = temp["node"];
        if (node["name"] == "null") {
            continue;
        }
        component = temp["component"];
        node["children"] = [];
        node["children"] = [{"name": component["leftChild"]}, {"name": component["rightChild"]}];
        queue.push({"node": node["children"][0], "component": mapData[component["leftChild"]]}, {"node": node["children"][1], "component": mapData[component["rightChild"]]});
    }

    //console.log("Tree", Tree)
    return Tree;
}
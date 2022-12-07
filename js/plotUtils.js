export class plotController {
    constructor(layout, net_data){
        this.layout = layout;
        this.net_data = net_data;
        this.LVExtremum = [null, null, null, null];//minX, maxX, minY, maxY
        this.HVExtremum = [null, null, null, null];
        this.extremum = [null, null, null, null];
        this.ncOpacity;
        this.naOpacity;
        this.maOpacity;
        this.sdOpacity;
    }

    run(nc, na, ma, sd){ //netCompOpacity, netAreaOpacity, maxAreaOpacity, safetyDistanceOpacity
        this.ncOpacity = nc;
        this.naOpacity = na;
        this.maOpacity = ma;
        this.sdOpacity = sd;
        this.computeExtremum();
        this.netHighlighting();
        this.safetyDistance();
        this.maxArea();
    }

    // highlight specific net
    netHighlighting(){
        let netCheckBoxes = document.getElementById("netCheckBoxes");
        netCheckBoxes.setAttribute("align", "left");
        let netCheckBoxesId = [];
        let net_data = this.net_data;
        let layout = this.layout;
        let ncOpacity = this.ncOpacity;
        let setOpacity = (obj, opacity) => {
            obj.get("obj").setAttribute("opacity", opacity);
            obj.get("text").setAttribute("opacity", opacity);
            obj.get("pin").forEach( (pin) => {
                pin.setAttribute("opacity", opacity);
            });
        };
        
        for (let netName in net_data){
            let net = net_data[netName];
            let checkBox = document.createElement("input");
            checkBox.setAttribute("type", "checkbox");
            checkBox.setAttribute("id", net["name"]);
            checkBox.setAttribute("name", net["name"]);

            netCheckBoxesId.push(net["name"]);
            netCheckBoxes.appendChild(checkBox);
            netCheckBoxes.appendChild(document.createTextNode(net["name"]));
            netCheckBoxes.appendChild(document.createElement("br"));
        }

        let otherComps = new Map();// store components not in a net, while it should technically store nothing
        let ZVComps = new Map();// store components with zero voltage by def
        layout.layout_front.comp_list.forEach((comp, name) => {
            otherComps.set(name, true);
            if (comp.get("vol") == 0){
                ZVComps.set(name, true);
            }
        });
        layout.layout_back.comp_list.forEach((comp, name) => {
            otherComps.set(name, true);
            if (comp.get("vol") == 0){
                ZVComps.set(name, true);
            }
        });
        netCheckBoxesId.forEach((cbId) => {
            let cb = document.getElementById(cbId);
            for (let comp in net_data[cb.name]["component"]){
                otherComps.delete(comp);
            }
        });


        // create box for net
        let netArea = new Map();
        for (let net in net_data){
            let netExtremum = [null, null, null, null]; //minX, maxX, minY, maxY
            for (let compName in net_data[net]["component"]){
                let comp = net_data[net]["component"][compName];
                
                if (ZVComps.has(comp["name"])){
                    if (layout.layout_front.comp_list.has(comp["name"])){
                        this.updateExtremum(layout.layout_front.comp_list.get(comp["name"]).get("pin").get(comp["pin"]), netExtremum);
                    }
                    if (layout.layout_back.comp_list.has(comp["name"])){
                        this.updateExtremum(layout.layout_back.comp_list.get(comp["name"]).get("pin").get(comp["pin"]), netExtremum);
                    }
                }
                else{
                    if (layout.layout_front.comp_list.has(comp["name"])){
                        this.updateExtremum(layout.layout_front.comp_list.get(comp["name"]).get("obj"), netExtremum);
                    }
                    if (layout.layout_back.comp_list.has(comp["name"])){
                        this.updateExtremum(layout.layout_back.comp_list.get(comp["name"]).get("obj"), netExtremum);
                    }
                }
            }

            let netArea1 = document.createElementNS("http://www.w3.org/2000/svg", 'rect');
            let netArea2 = document.createElementNS("http://www.w3.org/2000/svg", 'rect');
            for (let a of [netArea1, netArea2]){
                a.setAttribute('x', netExtremum[0]);
                a.setAttribute('y', netExtremum[2]);
                a.setAttribute('width', netExtremum[1] - netExtremum[0]);
                a.setAttribute('height', netExtremum[3] - netExtremum[2]);
                a.style["stroke"] = "blue";
                a.style["fill"] = "none";
                a.style["stroke-width"] = "0.2";
                a.style['opacity'] = this.naOpacity;
                a.style["display"] = "none";
            }
            layout.layout_front.svg.appendChild(netArea1);
            layout.layout_back.svg.appendChild(netArea2);

            netArea.set(net, [netArea1, netArea2]);
        }
        // end of create box for net

        let boxes = netCheckBoxes.getElementsByTagName('input');
        for (let i=0, len=boxes.length; i<len; i++) {
            if ( boxes[i].type === 'checkbox' ) {
                boxes[i].onclick = function() { //WARNING! in onclick funtion, "this" does not mean the class
                    let anyChecked = false; //if any box is checked

                    netCheckBoxesId.forEach((cbId) => {//transparentize all  
                        let cb = document.getElementById(cbId);

                        for (let comp in net_data[cb.name]["component"]){
                            if (layout.layout_front.comp_list.has(comp)){
                                setOpacity(layout.layout_front.comp_list.get(comp), ncOpacity);
                            }
                            if (layout.layout_back.comp_list.has(comp)){
                                setOpacity(layout.layout_back.comp_list.get(comp), ncOpacity);
                            }
                        }
                        netArea.get(cbId).forEach( (area) =>{
                            area.style["display"] = "none";
                        });
                    });
                    netCheckBoxesId.forEach((cbId) =>{ //opaques selected components
                        let cb = document.getElementById(cbId);

                        if (cb.checked == true){ 
                            anyChecked = true;
                            for (let comp in net_data[cb.name]["component"]){
                                if (layout.layout_front.comp_list.has(comp)){
                                    setOpacity(layout.layout_front.comp_list.get(comp), 1.0);
                                }
                                if (layout.layout_back.comp_list.has(comp)){
                                    setOpacity(layout.layout_back.comp_list.get(comp), 1.0);
                                }
                            }
                            netArea.get(cbId).forEach( (area) =>{
                                area.style["display"] = "block";
                            });
                        }
                    });

                    if (anyChecked == false){  //if no box is checked, opaques all
                        layout.layout_front.comp_list.forEach((comp) => {
                            setOpacity(comp, 1.0);
                        });
                        layout.layout_back.comp_list.forEach((comp) => {
                            setOpacity(comp, 1.0);
                        });
                        netCheckBoxesId.forEach((cbId) =>{
                            netArea.get(cbId).forEach( (area) =>{
                                area.style["display"] = "none";
                            });
                        });
                    }
                    else{ // some box is checked, transparentizes all component not in a net
                        for (let comp of otherComps.keys()){
                            if (layout.layout_front.comp_list.has(comp)){
                                setOpacity(layout.layout_front.comp_list.get(comp), ncOpacity);
                            }
                            if (layout.layout_back.comp_list.has(comp)){
                                setOpacity(layout.layout_back.comp_list.get(comp), ncOpacity);
                            }
                        }
                    }
                }//end of onclick
            }
        }
}
// end of highlight specific net

//computed for SafetyDistance and MaxArea
    computeExtremum(){
        this.layout.layout_front.comp_list.forEach((comp) => {
            this.updateExtremum(comp.get("obj"), this.extremum);
            if (comp.get("vol") === 1){
                this.updateExtremum(comp.get("obj"), this.HVExtremum);
            }
            else if (comp.get("vol") === -1){
                this.updateExtremum(comp.get("obj"), this.LVExtremum);
            }
        });
        this.layout.layout_back.comp_list.forEach((comp) => {
            this.updateExtremum(comp.get("obj"), this.extremum);
            if (comp.get("vol") === 1){
                this.updateExtremum(comp.get("obj"), this.HVExtremum);
            }
            else if (comp.get("vol") === -1){
                this.updateExtremum(comp.get("obj"), this.LVExtremum);
            }
        });
    }

//show SafetyDistance 
    safetyDistance(){
        let sdline;
        sdline = this.drawSafetyDistance(this.LVExtremum[0], this.LVExtremum[1], this.HVExtremum[0], this.HVExtremum[1]);
        let sdbox = document.getElementById("show-SafetyDistance");
        sdbox.onclick = function() {
            for (let LandA of sdline){
                if (sdbox.checked === true){
                    LandA[0].style.display = "block";
                    LandA[1].style.display = "block";
                }
                else{
                    LandA[0].style.display = "none";
                    LandA[1].style.display = "none";
                }
            }
        };
    }
//end of show SafetyDistance

//show MaxArea
    maxArea(){
        let maxArea1 = document.createElementNS("http://www.w3.org/2000/svg", 'rect');
        let maxArea2 = document.createElementNS("http://www.w3.org/2000/svg", 'rect');
        let cbMA = document.getElementById("show-MaxArea");
        for (let maxArea of [maxArea1, maxArea2]){
            maxArea.setAttribute('x', this.extremum[0]);
            maxArea.setAttribute('y', this.extremum[2]);
            maxArea.setAttribute('width', this.extremum[1] - this.extremum[0]);
            maxArea.setAttribute('height', this.extremum[3] - this.extremum[2]);
            maxArea.style["stroke"] = "red";
            maxArea.style["fill"] = "none";
            maxArea.style["stroke-width"] = "0.2";
            maxArea.style['opacity'] = this.maOpacity;
            maxArea.style["display"] = "none";
        }
        this.layout.layout_front.svg.appendChild(maxArea1);
        this.layout.layout_back.svg.appendChild(maxArea2);
        cbMA.onclick = function() {
            for (let maxArea of [maxArea1, maxArea2]){
                if (cbMA.checked === true){
                    maxArea.style["display"] = "block";
                }
                else{
                    maxArea.style["display"] = "none";
                }
            }
        };
    }
//end of show MaxArea

    updateExtremum(comp, extreme){
        let xmin =  comp["x"].animVal.value;
        let xmax =  comp["x"].animVal.value + comp["width"].animVal.value;
        let ymin =  comp["y"].animVal.value;
        let ymax =  comp["y"].animVal.value + comp["height"].animVal.value;

        if (extreme[0] === null || xmin < extreme[0]){
            extreme[0] = xmin;
        }
        if (extreme[1] === null || xmax > extreme[1]){
            extreme[1] = xmax;
        }
        if (extreme[2] === null || ymin < extreme[2]){
            extreme[2] = ymin;
        }
        if (extreme[3] === null || ymax > extreme[3]){
            extreme[3] = ymax;
        } 
    }

    drawSafetyDistance(lvmix, lvmax, hvmix, hvmax) {
        let line1 = document.createElementNS("http://www.w3.org/2000/svg", 'polyline');
        let line2 = document.createElementNS("http://www.w3.org/2000/svg", 'polyline');
        let safearea1 = document.createElementNS("http://www.w3.org/2000/svg", 'rect');
        let safearea2 = document.createElementNS("http://www.w3.org/2000/svg", 'rect');
        let label = document.getElementById("sdlabel");
        let sorted = [lvmix, lvmax, hvmix, hvmax];
        sorted = sorted.sort((a, b) => {return a - b});
        let midx = (sorted[1] + sorted[2]) / 2;
        let sdlength = round(sorted[2] - sorted[1], 3);
        let polyline = [midx, -100, midx, 100];

        for (let l of [line1, line2]){
            l.setAttribute("points", polyline);
            l.setAttribute("fill", "none");
            l.style["stroke"] = "black";
            l.style["stroke-width"] = "0.2";
            l.style["stroke-dasharray"] = "0.4";
            l.style["display"] = "none";
        }
        for (let a of [safearea1, safearea2]){
            a.setAttribute('x', midx - 3.4);
            a.setAttribute('y', this.layout.layout_back.margin_y);
            a.setAttribute('width', 6.8);
            a.setAttribute('height', this.layout.layout_back.height);
            a.setAttribute('fill', "#FFA500");
            a.setAttribute('opacity', this.sdOpacity);
            a.style["display"] = "none";
        }
        label.textContent = sdlength;
        label.style.color = "red";
        this.layout.layout_front.svg.appendChild(line1);
        this.layout.layout_back.svg.appendChild(line2);
        this.layout.layout_front.svg.appendChild(safearea1);
        this.layout.layout_back.svg.appendChild(safearea2);
        return [[line1, safearea1], [line2, safearea2]];
    }
};

function round(num, digit) {
    return +(Math.round(num + `e+${digit}`)  + `e-${digit}`);
}
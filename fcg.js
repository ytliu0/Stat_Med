"use strict";

// Set global arrays for plotting the ROC curve
let sen_arr=[], fp_arr=[];

function init() {
    document.getElementById("wrapper").style.display = "block";
    // Initialize the global arrays
    let n = 201; // Number of points in the ROC curve
    let x1 = 3.9, x2 = 8.9
    let dx = (x2-x1)/(n-1);
    for (let i=0; i<n; i++) {
        let fcg = x1 + i*dx;
        sen_arr.push(1.0 - Fpos(fcg));
        fp_arr.push(1.0 - Fneg(fcg));
    }
    
    let fcg = 5.6;
    document.getElementById("newFCGcutoff").value = fcg;
    // set the default simulation parameters
    document.getElementById("simFCGcutoff").value = fcg;
    document.getElementById("simnp").value = 100;
    document.getElementById("ncond").innerHTML = 40;
    document.getElementById("simpcond").value = 40;
    validateSimParas();
}

// Draw ROC curve
function drawROC(canvasId, FCGcut) {
    let canvas = document.getElementById(canvasId);
    let ctx = canvas.getContext('2d');
    let width = canvas.width, height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    
    // Draw plot boundary box
    let facx = 0.8, facy = 0.85;
    let gwidth = facx*width, gheight = facy*height;
    let xstart = (0.97-facx)*width;
    let ystart = 0.03*height;
    ctx.rect(xstart, ystart, facx*width, facy*height);
    ctx.stroke();
    // test
    //ctx.rect(0, 0, width, height);
    //ctx.stroke();
    
    // Draw ROC curve
    ctx.beginPath();
    let x = xstart + fp_arr[0]*gwidth;
    let y = ystart + (1 - sen_arr[0])*gheight;
    let i;
    ctx.moveTo(x, y);
    for (i=1; i<sen_arr.length; i++) {
        x = xstart + fp_arr[i]*gwidth;
        y = ystart + (1 - sen_arr[i])*gheight;
        ctx.lineTo(x,y);
    }
    ctx.stroke(); 
    
    // Draw the point on the curve with the given FCGcut
    x = xstart + (1 - Fneg(FCGcut))*gwidth;
    y = ystart + Fpos(FCGcut)*gheight;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2*Math.PI);
    ctx.fillStyle = "red";
    ctx.fill();
    
    // Draw axis ticks
    let txt;
    let nx = 11;
    let dx = 1.0/(nx-1);
    y = ystart + gheight;
    ctx.font = "15px Arial";
    ctx.fillStyle = "black";
    for (i=0; i<nx; i++) {
        x = xstart + i*dx*gwidth;
        ctx.beginPath(); 
        ctx.moveTo(x, y);
        ctx.lineTo(x,y+7);
        ctx.stroke(); 
        txt = (i*dx).toFixed(1);
        let w = ctx.measureText(txt).width;
        ctx.fillText(txt, x-0.5*w, y+22); 
    }
    let ny = 11;
    let dy = 1.0/(ny-1);
    x = xstart;
    for (i=0; i<ny; i++) {
        y = ystart + (1 - i*dy)*gheight;
        ctx.beginPath(); 
        ctx.moveTo(x, y);
        ctx.lineTo(x-7, y);
        ctx.stroke(); 
        txt = (i*dy).toFixed(1);
        ctx.fillText(txt, x-30, y+5); 
    }
    
    // Draw axis labels
    ctx.font = "20px Arial";
    txt = "1 - Specificity";
    ctx.fillText(txt, xstart+0.3*gwidth, ystart+gheight+50); 
    ctx.save();
    ctx.translate(xstart-45, ystart+0.6*gheight);
    ctx.rotate(-0.5*Math.PI);
    ctx.fillText("Sensitivity",0,0);
    ctx.restore();
}

// Control the event for newFCGcutoff:
// When the mouse is down, add an event listener for mousemove;
// when the mouse is up, remove the event listener for mousemove.
// Thus calculation is performed when the user drags the mouse.
function newFCGcutoff(event) {
    let slider = document.getElementById("newFCGcutoff");
    if (event=="up") {
       slider.setAttribute('movelistener', 'off');
       setNewFCGcutoff();
       simulation();
    } else if (event=="down") {
       slider.setAttribute('movelistener', 'on');
    } else if (event=='move' && slider.getAttribute('movelistener')=='on') {
       setNewFCGcutoff();
       simulation();
    }
}

function setNewFCGcutoff() {
    let fcg = parseFloat(document.getElementById("newFCGcutoff").value);
    let txt = fcg.toFixed(1)+" mmol/l";
    assignValClass("FCGcutoff",txt);
    let tn = Fneg(fcg), tp = 1-Fpos(fcg);
    txt = (tn*100).toFixed(1)+"%";
    assignValClass("TN",txt);
    txt = (100-tp*100).toFixed(1)+"%";
    assignValClass("FN",txt);
    txt = (tp*100).toFixed(1)+"%";
    assignValClass("TP",txt);
    txt = (100-tn*100).toFixed(1)+"%";
    assignValClass("FP",txt);
    let np = parseInt(document.getElementById("simnp").value);
    let ncond = parseInt(document.getElementById("ncond").innerHTML);
    let nNoCond = np - ncond;
    let ntp = ncond*tp;
    let nfp = nNoCond*(1-tn);
    let ntn = nNoCond*tn;
    let nfn = ncond*(1-tp);
    let pp = 100*ntp/(ntp + nfp), nn = 100*ntn/(ntn + nfn);
    document.getElementById("pp").innerHTML = pp.toFixed(1)+"%";
    document.getElementById("nn").innerHTML = nn.toFixed(1)+"%";
    drawROC("ROC",fcg);
    document.getElementById("simFCGcutoff").value = fcg;
}

// Function to validate the simulation parameters and then 
// perform the simulation
function validateSimParas() {
    let x = document.forms["simPara"];
    let fcg = parseFloat(x["simFCGcutoff"].value);
    let np = parseInt(x["simnp"].value);
    let pcond = parseFloat(x["simpcond"].value);
    let errid = "err";
    document.getElementById(errid).innerHTML = "";
    let min = 3.9, max = 8.9;
    let message = "Invalid input for FCG cutoff! Please enter a number between "+min+" and "+max+".";
    sanityCheck(fcg,"simFCGcutoff",min,max,message,errid);
    min = 10; max = 10000;
    message = "Invalid input for number of people! Please enter an integer between "+min+" and "+max+".";
    sanityCheck(np,"simnp",min,max,message,errid);
    if (!isNaN(np) && np >= min && np <= max) {
        min = 0; max = 100;
        message = "Invalid input for percentage of people really have diabetes! Please enter a number between "+min+" and "+max+".";
        sanityCheck(pcond,"simpcond",min,max,message,errid);
    }
    
    if (document.getElementById(errid).innerHTML == "") {
        fcg = 0.1*Math.floor(fcg*10 + 0.5);
        let ncond = Math.floor(0.01*pcond*np + 0.5);
        document.getElementById("ncond").innerHTML = ncond;
        pcond = ncond/np*100;
        document.getElementById("newFCGcutoff").value = fcg.toFixed(1);
        setNewFCGcutoff();
        document.getElementById("simnp").value = np;
        document.getElementById("simpcond").value = pcond.toFixed(1);
        simulation();
    }
}

// Simulation
function simulation() {
    let FCGcutoff = parseFloat(document.getElementById("simFCGcutoff").value);
    let np = parseInt(document.getElementById("simnp").value);
    let ncond = parseInt(document.getElementById("ncond").innerHTML);
    let ftp = 1 - Fpos(FCGcutoff); // true positive rate
    let ffp = 1 - Fneg(FCGcutoff); // false positive rate
    
    // compute simulated # of true positives and false positives
    let fp = 0, tp = 0, i;
    let nNoCond = np - ncond;
    for (i=0; i<ncond; i++) {
        if (Math.random() < ftp) { tp++;}
    }
    for (i=0; i<nNoCond; i++) {
        if (Math.random() < ffp) { fp++;}
    }
    let txt1 = tp, txt2 = ncond-tp;
    if (ncond > 0) {
        txt1 += " ("+(100.0*tp/ncond).toFixed(1)+"%)";
        txt2 += " ("+(100 - 100.0*tp/ncond).toFixed(1)+"%)";
    }
    document.getElementById("STP").innerHTML = txt1;
    document.getElementById("SFN").innerHTML = txt2;
    txt1 = fp; txt2 = nNoCond-fp;
    if (nNoCond > 0) {
        txt1 += " ("+(100.0*fp/nNoCond).toFixed(1)+"%)";
        txt2 += " ("+(100 - 100.0*fp/nNoCond).toFixed(1)+"%)";
    }
    document.getElementById("SFP").innerHTML = txt1;
    document.getElementById("STN").innerHTML = txt2;
    let pp = 100.0*tp/(tp + fp), nn = 100.0*(nNoCond-fp)/(np-fp-tp);
    document.getElementById("simpp").innerHTML = pp.toFixed(1)+"%";
    document.getElementById("simnn").innerHTML = nn.toFixed(1)+"%";
}

// Cubic Hermite interpolation
// Note: x must be inside the range of the table in xa and values in
// xa must be in ascending order. 
// This function won't check that.
function cubicHermite(x, xa, ya, m) {
    let i;
    for (i=0; i<xa.length; i++) {
        if (x <= xa[i]) { break;}
    }
    let h = xa[i]-xa[i-1];
    let t = (x - xa[i-1])/h;
    let f1_t2 = (1-t)*(1-t);
    let h00 = (1+2*t)*f1_t2;
    let h10 = t*f1_t2;
    let h01 = t*t*(3-2*t);
    let h11 = t*t*(t-1);
    return ya[i-1]*h00 + h*m[i-1]*h10 + ya[i]*h01 + h*m[i]*h11;
}

// Calculate the cumulative probability function of 
// the "positive" population
// using the data in Table 2 of Diabetes Care, 17, 11 (1994) with 
// a monotone Hermite interpolation
// x: FCG level in mmol/l
function Fpos(x) {
    // Data from Table 3
    let xa = [3.9, 4.4, 5, 5.6, 6.1, 6.7, 7.2, 7.8, 8.3, 8.9];
    let ya = [0.029, 0.046, 0.08, 0.128, 0.256, 0.353, 0.464, 0.507, 0.57, 0.621];
    let m = [0.034, 0.04533333333333333, 0.06833333333333333, 0.168, 0.2088333333333333, 
         0.1918333333333333, 0.1468333333333333, 0.09883333333333333, 0.1055, 0.085];
    
    let F = 0, a,b;
    let x1 = xa[0], x2 = xa[xa.length-1];
    
    if (x <= x1) {
        if (x > 0) {
          // Use fitting curve dF/dx = a xz exp(bx)
          a = 0.000354361143488554;
          b = 0.8212365841056469;
          let expval = Math.exp(b*x);
          F = a/(b*b)*(b*x*expval + 1 - expval);   
        }
    } else if (x >= x2) {
        // set it to 1 - exp[-a (x-b)^2]
        a = 0.01296073502595711;
        b = 0.2479287292237569
        F = 1 - Math.exp(-a*(x-b)*(x-b));
    } else {
        F = cubicHermite(x, xa,ya,m);
    }
    
    return F;
}

// Calculate the cumulative probability function of 
// the "negative" population 
// using the data in Table 2 of Diabetes Care, 17, 11 (1994) with 
// a monotone Hermite interpolation
// x: FCG level in mmol/l
function Fneg(x) {
    // Data from Table 3
    let xa = [3.9, 4.4, 5, 5.6, 6.1, 6.7, 7.2, 7.8, 8.3, 8.9];
    let ya = [0.229, 0.447, 0.619, 0.724, 0.873, 0.938, 0.97, 0.984, 0.992, 0.994];
    let m = [0.436, 0.3613333333333333, 0.2308333333333333, 0.2365, 0.2031666666666667, 
         0.0861666666666667, 0.04366666666666667, 0.01966666666666667, 
         0.009453729816262732, 0.003259906833194053];
    
    let F = 0, a,b;
    let x1 = xa[0], x2 = xa[xa.length-1];
    
    if (x <= x1) {
        if (x > 0) {
           // Use fitting curve dF/dx = ax exp(bx)
           a = 0.0002186045424688485;
           b = 1.599270926627726;
           let expval = Math.exp(b*x);
           F = a/(b*b)*(b*x*expval + 1 - expval); 
        }
    } else if (x >= x2) {
        // set it to 1 - 0.006 e^{-k(x-8.9)} with k = 0.5433178055323422
        F = 1 - 0.006*Math.exp(-0.5433178055323422*(x-x2));
    } else {
        F = cubicHermite(x, xa,ya,m);
    }
    
    return F;
}

// sanity check
// If there are errors, print message in red at the place 
// indicated by the id errid
function sanityCheck(x,inputId,min,max,message,errid) {
    document.getElementById(inputId).style.backgroundColor = "transparent";
    if (isNaN(x) || x < min || x > max) {
        document.getElementById(inputId).style.backgroundColor = "#e2a8a8";
        let text = '<p style="color:red;">'+message+'</p>';
        document.getElementById(errid).innerHTML += text;
    }
}

// Assign value to a class
function assignValClass(classid, val) {
    let x = document.getElementsByClassName(classid);
    for (let i=0; i < x.length; i++) {
        x[i].innerHTML = val;
    }
}

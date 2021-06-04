"use strict";

// Set global arrays for plotting the ROC curve
let sen_arr=[], fp_arr=[];

function init() {
    document.getElementById("wrapper").style.display = "block";
    // Initialize the global arrays
    let n = 201; // Number of points in the ROC curve
    let dx = 10.1/(n-1);
    for (let i=0; i<n; i++) {
        let psa = i*dx;
        sen_arr.push(1.0 - Fpos(psa));
        fp_arr.push(1.0 - Fneg(psa));
    }
    
    let psa = 4.1;
    document.getElementById("newPSAcutoff").value = psa;
    // set the default simulation parameters
    document.getElementById("simPSAcutoff").value = psa;
    document.getElementById("simnp").value = 100;
    document.getElementById("ncancer").innerHTML = 40;
    document.getElementById("simpcancer").value = 40;
    validateSimParas();
}

// Draw ROC curve
function drawROC(canvasId, PSAcut) {
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
    
    // Draw the point on the curve with the given PSAcut
    x = xstart + (1 - Fneg(PSAcut))*gwidth;
    y = ystart + Fpos(PSAcut)*gheight;
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

// Control the event for newPSAcutoff:
// When the mouse is down, add an event listener for mousemove;
// when the mouse is up, remove the event listener for mousemove.
// Thus calculation is performed when the user drags the mouse.
function newPSAcutoff(event) {
    let slider = document.getElementById("newPSAcutoff");
    if (event=="up") {
       slider.setAttribute('movelistener', 'off');
       setNewPSAcutoff();
       simulation();
    } else if (event=="down") {
       slider.setAttribute('movelistener', 'on');
    } else if (event=='move' && slider.getAttribute('movelistener')=='on') {
       setNewPSAcutoff();
       simulation();
    }
}

function setNewPSAcutoff() {
    let psa = parseFloat(document.getElementById("newPSAcutoff").value);
    let txt = psa.toFixed(1)+" ng/mL";
    assignValClass("PSAcutoff",txt);
    let tn = Fneg(psa), tp = 1-Fpos(psa);
    txt = (tn*100).toFixed(1)+"%";
    assignValClass("TN",txt);
    txt = (100-tp*100).toFixed(1)+"%";
    assignValClass("FN",txt);
    txt = (tp*100).toFixed(1)+"%";
    assignValClass("TP",txt);
    txt = (100-tn*100).toFixed(1)+"%";
    assignValClass("FP",txt);
    let np = parseInt(document.getElementById("simnp").value);
    let ncancer = parseInt(document.getElementById("ncancer").innerHTML);
    let nNoCancer = np - ncancer;
    let ntp = ncancer*tp;
    let nfp = nNoCancer*(1-tn);
    let ntn = nNoCancer*tn;
    let nfn = ncancer*(1-tp);
    let pp = 100*ntp/(ntp + nfp), nn = 100*ntn/(ntn + nfn);
    document.getElementById("pp").innerHTML = pp.toFixed(1)+"%";
    document.getElementById("nn").innerHTML = nn.toFixed(1)+"%";
    drawROC("ROC",psa);
    document.getElementById("simPSAcutoff").value = psa;
}

// Function to validate the simulation parameters and then 
// perform the simulation
function validateSimParas() {
    let x = document.forms["simPara"];
    let psa = parseFloat(x["simPSAcutoff"].value);
    let np = parseInt(x["simnp"].value);
    let pcancer = parseFloat(x["simpcancer"].value);
    let errid = "err";
    document.getElementById(errid).innerHTML = "";
    let min = 0.0, max = 10.1;
    let message = "Invalid input for PSA cutoff! Please enter a number between "+min+" and "+max+".";
    sanityCheck(psa,"simPSAcutoff",min,max,message,errid);
    min = 10; max = 10000;
    message = "Invalid input for number of people! Please enter an integer between "+min+" and "+max+".";
    sanityCheck(np,"simnp",min,max,message,errid);
    if (!isNaN(np) && np >= min && np <= max) {
        min = 0; max = 100;
        message = "Invalid input for the percentage of people really have prostate cancers! Please enter a number between "+min+" and "+max+".";
        sanityCheck(pcancer,"simpcancer",min,max,message,errid);
    }
    
    if (document.getElementById(errid).innerHTML == "") {
        psa = 0.1*Math.floor(psa*10 + 0.5);
        let ncancer = Math.floor(0.01*pcancer*np + 0.5);
        document.getElementById("ncancer").innerHTML = ncancer;
        pcancer = ncancer/np*100;
        //assignValClass("ntests",np);
        //assignValClass("hasCancer",ncancer);
        //assignValClass("noCancer",np-ncancer);
        document.getElementById("newPSAcutoff").value = psa.toFixed(1);
        setNewPSAcutoff();
        document.getElementById("simnp").value = np;
        document.getElementById("simpcancer").value = pcancer.toFixed(1);
        simulation();
    }
}

// Simulation
function simulation() {
    let PSAcutoff = parseFloat(document.getElementById("simPSAcutoff").value);
    let np = parseInt(document.getElementById("simnp").value);
    let ncancer = parseInt(document.getElementById("ncancer").innerHTML);
    let ftp = 1 - Fpos(PSAcutoff); // true positive rate
    let ffp = 1 - Fneg(PSAcutoff); // false positive rate
    
    // compute simulated # of true positives and false positives
    let fp = 0, tp = 0, i;
    let nNoCancer = np - ncancer;
    for (i=0; i<ncancer; i++) {
        if (Math.random() < ftp) { tp++;}
    }
    for (i=0; i<nNoCancer; i++) {
        if (Math.random() < ffp) { fp++;}
    }
    let txt1 = tp, txt2 = ncancer-tp;
    if (ncancer > 0) {
        txt1 += " ("+(100.0*tp/ncancer).toFixed(1)+"%)";
        txt2 += " ("+(100 - 100.0*tp/ncancer).toFixed(1)+"%)";
    }
    document.getElementById("STP").innerHTML = txt1;
    document.getElementById("SFN").innerHTML = txt2;
    txt1 = fp; txt2 = nNoCancer-fp;
    if (nNoCancer > 0) {
        txt1 += " ("+(100.0*fp/nNoCancer).toFixed(1)+"%)";
        txt2 += " ("+(100 - 100.0*fp/nNoCancer).toFixed(1)+"%)";
    }
    document.getElementById("SFP").innerHTML = txt1;
    document.getElementById("STN").innerHTML = txt2;
    let pp = 100.0*tp/(tp + fp), nn = 100.0*(nNoCancer-fp)/(np-fp-tp);
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
// the "positive" population (i.e. with prostate cancer) 
// using the data in Table 3 of JAMA, 294, 66 (2005) with 
// a monotone Hermite interpolation
// x: PSA level in ng/mL
function Fpos(x) {
    // Data from Table 3
    let xa = [1.1,1.6,2.1,2.6,3.1,4.1,6.1,8.1,10.1];
    let ya = [0.166, 0.33, 0.474, 0.595, 0.678, 0.795, 0.954, 0.983, 0.991];
    let m = [0.328, 0.308, 0.265, 0.204, 0.1415, 0.09825, 0.04268125383365261, 
             0.008400033999176321, 0.004];
    
    let F = 0;
    let x1 = xa[0], x2 = xa[xa.length-1];
    
    if (x <= x1) {
        if (x > 0) {
          // Use fitting curve F=x^2(ax+b)
          let a = 0.1133884297520663;
          let b = 0.02163786626596526;
          F = x*x*(a + b*x);   
        }
    } else if (x >= x2) {
        // set it to 1 - 0.009 e^{-k(x-10.1)} with k = -4/9
        F = 1 - 0.009*Math.exp(-4.0*(x-x2)/9.0);
    } else {
        F = cubicHermite(x, xa,ya,m);
    }
    
    return F;
}

// Calculate the cumulative probability function of 
// the "negative" population (i.e. without prostate cancer) 
// using the data in Table 3 of JAMA, 294, 66 (2005) with 
// a monotone Hermite interpolation
// x: PSA level in ng/mL
function Fneg(x) {
    // Data from Table 3
    let xa = [1.1,1.6,2.1,2.6,3.1,4.1,6.1,8.1,10.1];
    let ya = [0.389,0.587,0.725,0.811,0.867,0.938,0.985,0.994,0.997];
    let m = [0.396, 0.336, 0.224, 0.142, 0.0915, 0.04725, 0.01320033259004504, 
         0.002828642697866794, 0.0015];
    
    let F = 0;
    let x1 = xa[0], x2 = xa[xa.length-1];
    
    if (x <= x1) {
        if (x > 0) {
           // Use fitting curve F=x^2(ax+b)
           let a = 0.6044628099173553;
           let b = -0.2572501878287002;
           F = x*x*(a + b*x);
        }
    } else if (x >= x2) {
        // set it to 1 - 0.003 e^{-k(x-10.1)} with k = -1/2
        F = 1 - 0.003*Math.exp(-0.5*(x-x2));
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

"use strict";

var absZalp; // set global variable to store the value of |Z_alpha|
var n1, n2;       // sample size
var dmu, sigma1, sigma2, alpha, SE, Deffect, testType;
var lockn; // lock n1=n2 ?
// values of alpha (in %) for the alpha input range
var alpha_table = [0.01, 0.05, 0.1, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5,
                   6, 7, 8,  9, 10, 15, 20, 30, 40, 50];

function init() {
  document.getElementById("wrapper").style.display = "block";
  dmu = 10;
  sigma1 = 20;
  sigma2 = 25;
  document.getElementById("dmu").value = dmu;
  document.getElementById("sigma1").value = sigma1;
  document.getElementById("sigma2").value = sigma2;
  // Set default value of alpha and set the input range
  document.getElementById("alphaInput").min = 0;
  document.getElementById("alphaInput").max = alpha_table.length-1;
  var ind = 12;
  document.getElementById("alphaInput").value = ind; 
  document.getElementById("alpha").innerHTML = alpha_table[ind].toPrecision(2)+"%"; 
  document.getElementById("testType1").checked = true;
  document.getElementById("testType2").checked = false;
  document.getElementById("lockn").checked = true;
  document.getElementById("ulockn").checked = false;
  testType = 1; // one-sided test
  lockn = true; // lock n1=n2
  validateHypothesesParas()
}

// Function to validate the hypotheses parameters mu0, muA and sigma
// Then set the value of n so that beta(alpha=5%, n) \approx 20%.
// Display the results.
function validateHypothesesParas() {
    var x = document.forms["hypotheses"];
    dmu = parseFloat(x["dmu"].value);
    sigma1 = parseFloat(x["sigma1"].value);
    sigma2 = parseFloat(x["sigma2"].value);
    var text, err = false;
    if (isNaN(dmu)) {
        text = "Invalid input! You entered a non-numerical value for &mu;<sub>0</sub>!"
        err = true;
    }
    if (isNaN(sigma1)) {
        if (!err) {
            text = "Invalid input! You entered a non-numerical value for &sigma;<sub>1</sub>!";
            err = true;
        } else {
            text += "<br />Invalid input! You entered a non-numerical value for &sigma;<sub>1</sub>!";
        }
    }
    if (isNaN(sigma2)) {
        if (!err) {
            text = "Invalid input! You entered a non-numerical value for &sigma;<sub>2</sub>!";
            err = true;
        } else {
            text += "<br />Invalid input! You entered a non-numerical value for &sigma;<sub>2</sub>!";
        }
    }
    if (sigma1 <= 0) {
        if(!err) {
            text = "Invalid input! &sigma;<sub>1</sub> must be positive!";
            err = true;
        } else {
            text += "<br />Invalid input! &sigma;<sub>1</sub> must be positive!";
        }
    }
    if (sigma2 <= 0) {
        if(!err) {
            text = "Invalid input! &sigma;<sub>2</sub> must be positive!";
            err = true;
        } else {
            text += "<br />Invalid input! &sigma;<sub>2</sub> must be positive!";
        }
    }
    if (!err && dmu==0) {
        text = "Invalid input! &mu;<sub>2</sub>-&mu;<sub>1</sub> must be nonzero!";
        err = true;
    }
    if (err) {
        document.getElementById("output").style.color="red";
        document.getElementById("output").innerHTML = text;
        clearCanvas();
        document.getElementById("beta").innerHTML = "";
        document.getElementById("power").innerHTML = "";
        document.getElementById("Dz").innerHTML = "";
        document.getElementById("SE").innerHTML = "";
        document.getElementById("Zbeta").innerHTML = "";
        document.getElementById("Deffect").innerHTML = "";
    } else {
        document.getElementById("output").style.color="black";
        Deffect = Math.abs(dmu); // effect size
        // set n1=n2=number so that if alpha = 5%, beta \approx 20%
        n1 = setN(Deffect,sigma1, sigma2, 2.486);
        n2 = n1;
        SE = Math.sqrt(sigma1*sigma1/n1 + sigma2*sigma2/n2);
        alpha = parseInt(document.getElementById("alphaInput").value);
        alpha = alpha_table[alpha];
        absZalp = qnorm(alpha*0.01/testType);
        var Dz = Deffect/SE;
        var Zbet = absZalp - Dz;
        var beta = pnorm(-Zbet)*100;
        if (testType==2) {
            beta = beta - 100*pnorm(absZalp+Dz);
        }
        var power = 100-beta;
        var Zalp=absZalp;
        if (dmu < 0) {
            Zalp = -Zalp;
            Zbet = -Zbet;
        }
        // set maximum n1, n2 so that |Z_A| = |muA-mu0|/SE \approx 6
        var nmax = setN(Deffect,sigma1, sigma2, 6);
        // set minimum n1, n2 so that Z_A = |muA-mu0|/SE \approx 1
        var nmin = setN(Deffect,sigma1, sigma2, 1);
        document.getElementById("n1Input").max = nmax;
        document.getElementById("n1Input").min = nmin;
        document.getElementById("n1Input").value = n1;
        document.getElementById("n2Input").max = nmax;
        document.getElementById("n2Input").min = nmin;
        document.getElementById("n2Input").value = n2;
        document.getElementById("n1").innerHTML = n1;
        document.getElementById("n2").innerHTML = n2;
        document.getElementById("beta").innerHTML = beta.toPrecision(3)+"%";
        document.getElementById("power").innerHTML = power.toPrecision(3)+"%";
        document.getElementById("SE").innerHTML = SE.toPrecision(3);
        document.getElementById("Zalpha").innerHTML = Zalp.toPrecision(4);
        document.getElementById("Zbeta").innerHTML = Zbet.toPrecision(3);
        document.getElementById("Deffect").innerHTML = Deffect.toPrecision(3);
        document.getElementById("Dz").innerHTML = Dz.toPrecision(4);
        // Draw graph
        clearCanvas();
        drawCurve(Zalp,testType);
    }
}

// Set n so that |Z_A| = D/SE \approx Za
// Here D = |dmu|
function setN(D,sigma1i,sigma2i,Za) {
    var ni = Za/D;
    ni = Math.ceil(ni*ni*(sigma1i*sigma1i + sigma2i*sigma2i));
    ni = Math.max(ni, 25); // limit n >= 25
    return(ni);
}

// Control the event for alphaInput:
// When the mouse is down, add an event listener for mousemove;
// when the mouse is up, remove the event listener for mousemove.
// Thus calculation is performed when the user drags the mouse.
function newAlpha(event) {
    if (event=="up") {
       document.getElementById("alphaInput").removeEventListener("mousemove",setNewAlpha); 
       setNewAlpha();
    } else if (event=="down") {
       document.getElementById("alphaInput").addEventListener("mousemove",setNewAlpha);
    }
}

// Control the event for n1Input and n2Input:
// When the mouse is down, add an event listener for mousemove;
// when the mouse is up, remove the event listener for mousemove.
// Thus calculation is performed when the user drags the mouse.
function newN(event,n_button) {
    if (n_button==1) {
       if (event=="up") {
          document.getElementById("n1Input").removeEventListener("mousemove",setNewN1); 
          setNewN1();
       } else if (event=="down") {
          document.getElementById("n1Input").addEventListener("mousemove",setNewN1);
       }    
    } else {
       if (event=="up") {
          document.getElementById("n2Input").removeEventListener("mousemove",setNewN2); 
          setNewN2();
       } else if (event=="down") {
          document.getElementById("n2Input").addEventListener("mousemove",setNewN2);
       }  
    }
}

// Change alpha and update the outputs
function setNewAlpha() {
      alpha = parseInt(document.getElementById("alphaInput").value);
      alpha = alpha_table[alpha];
      absZalp = qnorm(alpha*0.01/testType);
      var Dz = Deffect/SE;
      var Zbet = absZalp - Dz;
      var beta = pnorm(-Zbet)*100;
      if (testType==2) {
          beta = beta - 100*pnorm(absZalp+Dz);
      }
      var power = 100-beta;
      var Zalp=absZalp;
      if (dmu < 0) {
          Zalp = -Zalp;
          Zbet = -Zbet;
      }
      document.getElementById("alpha").innerHTML = alpha.toPrecision(2)+"%";
      document.getElementById("beta").innerHTML = beta.toPrecision(3)+"%";
      document.getElementById("power").innerHTML = power.toPrecision(3)+"%"; 
      document.getElementById("Zalpha").innerHTML = Zalp.toPrecision(4);
      document.getElementById("Zbeta").innerHTML = Zbet.toPrecision(3);
      clearCanvas();
      drawCurve(Zalp,testType);
}

// Change n and update the outputs
function setNewN1() {
    n1 = parseInt(document.getElementById("n1Input").value);
    if (lockn) {
        document.getElementById("n2Input").value = n1;
        n2=n1;
    }
    setNewN();
}

function setNewN2() {
    n2 = parseInt(document.getElementById("n2Input").value);
    if (lockn) {
        document.getElementById("n1Input").value = n2;
        n1=n2;
    }
    setNewN();
}

function setNewN() {
    SE = Math.sqrt(sigma1*sigma1/n1 + sigma2*sigma2/n2);
    var Dz = Deffect/SE;
    var Zbet = absZalp - Dz;
    var beta = pnorm(-Zbet)*100;
    if (testType==2) {
        beta = beta - 100*pnorm(absZalp+Dz);
    }
    var power = 100-beta;
    var Zalp=absZalp;
    if (dmu < 0) {
        Zalp = -Zalp;
        Zbet = -Zbet;
    }
    document.getElementById("n1").innerHTML = n1;
    document.getElementById("n2").innerHTML = n2;
    document.getElementById("beta").innerHTML = beta.toPrecision(3)+"%";
    document.getElementById("power").innerHTML = power.toPrecision(3)+"%";
    document.getElementById("SE").innerHTML = SE.toPrecision(3);
    document.getElementById("Zbeta").innerHTML = Zbet.toPrecision(3);
    document.getElementById("Dz").innerHTML = Dz.toPrecision(4);
    clearCanvas();
    drawCurve(Zalp,testType);
}

// lock/unlock n1=n2
function changeLockn(locked) {
    if (locked==1) {
        // lock n1=n2
        lockn = true;
        n1 = n2;
        document.getElementById("lockn").checked = true;
        document.getElementById("ulockn").checked = false;
        document.getElementById("n1Input").value = n2;
        setNewN();
    } else {
        // unlock n1=n2
        lockn = false;
        document.getElementById("lockn").checked = false;
        document.getElementById("ulockn").checked = true;
    }
}

// one-sided and two-sided test switch 
function changeTestType(ttype) {
    testType = ttype;
    if (ttype==1) {
        // one-sided test
        document.getElementById("testType1").checked = true;
        document.getElementById("testType2").checked = false;
    } else {
        // two-sided test
        document.getElementById("testType1").checked = false;
        document.getElementById("testType2").checked = true;
    }
    setNewAlpha();
}

// p-value for normal distribution: equivalent to R's pnorm(-z)
function pnorm(z) {
  var x = Math.SQRT1_2*Math.abs(z);
  
  // compute erfc(x) using an approximation formula (max rel error = 1.2e-7) 
  // see https://en.wikipedia.org/wiki/Error_function#Numerical_approximation
  var t = 1.0/(1+0.5*x);
  var t2 = t*t;
  var t3 = t2*t; 
  var t4 = t2*t2;
  var t5 = t2*t3; 
  var t6 = t3*t3; 
  var t7 = t3*t4;
  var t8 = t4*t4;
  var t9 = t4*t5;
  var tau = -x*x - 1.26551223 + 1.00002368*t + 0.37409196*t2 + 0.09678418*t3 - 0.18628806*t4 + 0.27886807*t5 - 1.13520398*t6 + 1.48851587*t7 - 0.82215223*t8 + 0.17087277*t9;

  var p = 0.5*t*Math.exp(tau);

  if (z < 0) {
     p = 1-p;
  }

  return p;
}

// z from right-tail p: same as R's qnorm(p, lower.tail=FALSE)
// Use bisection to find z. 
// Accuracy is set by the parameter eps
function qnorm(p) {
  if (p==0.5) {
     return 0;
  }

  if (p < 1e-300 || p > 1-3e-16) {
    return 1/0;
  }

  // Set accuracy parameter 
  var eps = 1.e-6;
  
  var pval = p;
  if (p > 0.5) {
     pval = 1-p;
  }

  // Start bisection search...
  // Set the upper and lower bound of z according to the inequalities
  // of erfc function described in 
  // https://en.wikipedia.org/wiki/Error_function#Approximation_with_elementary_functions :
  // erfc(x) \leq exp(-x^2)  for x>0, and 
  // erfc(x) \geq sqrt(2e/pi) sqrt(b-1)/b exp(-b x^2)  for x>0 and b>1 
  // The lower bound below comes from setting b=2.
  // Upper bound is multiplied by a safety factor 1.01; 
  // lower bound is multiplied by a safety factor 0.99.
  var sqrt_2pioe = 1.5203467;
  var min_arg = 2*pval*sqrt_2pioe;
  var minz = 0.0;
  if (min_arg < 1.0) {
     minz = 0.99*Math.sqrt( -Math.log(min_arg) );
  }
  var maxz = 1.01*Math.sqrt( -2*Math.log(2*pval) );
  var z = 0.5*(minz+maxz);

  while (maxz-minz > eps) {
    var pz = pnorm(z);
    if (pz > pval) { 
      minz = z;
    } else {
      maxz = z;
    }
    z = 0.5*(minz+maxz);
  }
  if (p > 0.5) {
    z = -z;
  }

  return z;
}

// Clear canvas
function clearCanvas() {
  var Canvas = document.getElementById('graph');
  var Ctx = Canvas.getContext('2d');
  Ctx.clearRect(0, 0, Canvas.width, Canvas.height);
}

// Draw two Gaussian curves and add shades
function drawCurve(Zalp, ttype) {
  var Canvas = document.getElementById('graph'); 
  var Ctx = null;
  var Width = Canvas.width;
  var Height = Canvas.height;
  // set max and min for x and z
  var w = 1.2*Deffect;
  var maxX = Math.max(0,dmu) + w, minX = Math.min(0,dmu)-w;
  var maxZ = maxX/SE, minZ = minX/SE;
  // deltaZ = spacing for the z ticks
  var deltaZ = 1;
  if (maxZ > 3) {
    deltaZ = Math.floor(maxZ/3);
  }
  // max and min of Y
  var maxY = 1.1;
  var minY = -0.3;
    
  if (Canvas.getContext) {
    // Set up the canvas:
    Ctx = Canvas.getContext('2d');
    Ctx.clearRect(0,0,Width,Height);
      
    // Set up graph parameters
    // Note that Width is reduced by 11 to make rooms 
    // for drawing x and z labels outside the plot
    var gpar = {"minZ":minZ, "maxZ":maxZ, "minY":minY, "maxY":maxY, 
                "Width":Width-11, "Height":Height};
      
    // Set up extra parameters for functions DrawAxes and RenderFunction
    var ZA = dmu/SE;
    var AxEx = {"deltaZ":deltaZ, "XaxisY":-0.15, "Xtics":[0,ZA], "X":[0,dmu], 
               "ZA":ZA};
    var renderEx0 = {"offset":0, "color":"black"};
    var renderExA = {"offset":ZA, "color":"blue"};
    var shadeEx = {"Zalp":Zalp, "ZA":ZA, "ttype":ttype};
    
    // Draw:
    ShadeCurve(Ctx, fgauss, gpar, shadeEx);
    DrawAxes(Ctx, gpar, AxEx);
    // draw the gaussian for H_0
    RenderFunction(Ctx, fgauss, gpar, renderEx0);
    // draw the gaussian for H_A
    RenderFunction(Ctx, fgauss, gpar, renderExA);
  } else {
    // Do nothing.
  }
}

/*
  The origin (0,0) of the canvas is the upper left:

  (0,0)
    --------- +X
   |
   |
   |
   |
   +Y

  Positive x coordinates go to the right, and positive y coordinates go down.

  The origin in mathematics is the "center," and positive y goes *up*.

  We'll refer to the mathematics coordinate system as the "logical"
  coordinate system, and the coordinate system for the canvas as the
  "physical" coordinate system.

  The functions just below set up a mapping between the two coordinate
  systems.

  They're defined as functions, so that one wanted to, they could read
  ther values from a from instead of having them hard-coded.
 
 */

// Returns the physical x-coordinate of a logical x-coordinate:
// p is an object with 3 properties: minX, rangeX and Width,
// where minX is the minimum value of x, rangeX = maxX-minX, and 
// Width is the width of the graph (in pixels)
function XC(x, p) {
  return (x - p.minX)/p.rangeX * p.Width;
}

// Returns the physical y-coordinate of a logical y-coordinate:
// p is an object with 3 properties: minY, rangeY and Height,
// where minY is the minimum value of y, rangeY = maxY-minY, and 
// Height is the height of the graph (in pixels)
function YC(y, p) {
  return p.Height - (y - p.minY)/p.rangeY * p.Height;
}


/* Rendering functions */
// Modified from http://matt.might.net/articles/rendering-mathematical-functions-in-javascript-with-canvas-html/

// function exp(-x^2/2)
var fgauss = function(x) {
  return Math.exp(-x*x*0.5);
} 


// DrawAxes draws the X, Z and Y axes, with tick marks and axis labels.
// gpar is an object with the properties minZ, maxZ, min, maxY, Width, 
// and Height.
// epar is an object with the properties deltaZ (spaceing for z ticks), 
// XaxisY (Y value of the X axis), Xtics (positions of the x-axis ticks), 
// X (x-axis tick labels), and ZA.
function DrawAxes(Ctx, gpar, epar) {
 Ctx.save() ;
 Ctx.lineWidth = 1 ;
 Ctx.strokeStyle = "rgb(128,128,128)";
 Ctx.font="14px Arial";
    
 // setup parameters for the function XC and YC
 var zpar = {"minX":gpar.minZ, "rangeX":gpar.maxZ-gpar.minZ, "Width":gpar.Width};
 var ypar = {"minY":gpar.minY, "rangeY":gpar.maxY-gpar.minY, "Height":gpar.Height};

 // Y axis
 //Ctx.beginPath();
 //Ctx.moveTo(XC(0, xpar),YC(gpar.minY, ypar));
 //Ctx.lineTo(XC(0, xpar),YC(gpar.maxY, ypar));
 //Ctx.stroke();

 // Z axis
 Ctx.beginPath();
 Ctx.moveTo(XC(gpar.minZ, zpar),YC(0, ypar));
 Ctx.lineTo(XC(gpar.maxZ, zpar),YC(0, ypar));
 Ctx.stroke();

 // Z tick marks
 var istart = Math.floor(gpar.minZ/epar.deltaZ);
 for (var i = istart; i*epar.deltaZ < gpar.maxZ; i++) {
  Ctx.beginPath();
  var z = i*epar.deltaZ; 
  if (z > gpar.minZ) {
    Ctx.moveTo(XC(z, zpar),YC(0, ypar)-5);
    Ctx.lineTo(XC(z, zpar),YC(0, ypar)+5);
    Ctx.stroke();  
    Ctx.fillText(z, XC(z, zpar)-3, YC(0, ypar)+20);
  }
 }

    
 // X axis
 Ctx.beginPath();
 Ctx.moveTo(XC(gpar.minZ, zpar),YC(epar.XaxisY, ypar));
 Ctx.lineTo(XC(gpar.maxZ, zpar),YC(epar.XaxisY, ypar));
 Ctx.stroke();
    
 // X axis tick marks
 Ctx.beginPath();
 for (var i=0; i<epar.Xtics.length; i++) {
     var z = epar.Xtics[i];
     Ctx.moveTo(XC(z, zpar),YC(epar.XaxisY, ypar)-5);
     Ctx.lineTo(XC(z, zpar),YC(epar.XaxisY, ypar)+5);
     Ctx.stroke();  
     Ctx.fillText(epar.X[i], XC(z, zpar)-7, YC(epar.XaxisY, ypar)+20);
 }
    
 // Z axis label
 Ctx.font="italic 20px Serif";
 Ctx.fillText("z", XC(gpar.maxZ, zpar)+3, YC(0,ypar)+4.7);
    
 // X axis label
 // var w = Ctx.measureText("x").width;
 Ctx.fillText("x - x",XC(gpar.maxZ, zpar)-27, YC(epar.XaxisY,ypar)+20);
 Ctx.font="12px Serif";
 Ctx.fillText("2",XC(gpar.maxZ, zpar)-19, YC(epar.XaxisY,ypar)+25);
 Ctx.fillText("1",XC(gpar.maxZ, zpar)+6, YC(epar.XaxisY,ypar)+25);  
 // add a bar above "x"
 Ctx.beginPath();
 Ctx.moveTo(XC(gpar.maxZ, zpar)-27,YC(epar.XaxisY, ypar)+8);
 Ctx.lineTo(XC(gpar.maxZ, zpar)-19,YC(epar.XaxisY, ypar)+8);
 Ctx.moveTo(XC(gpar.maxZ, zpar)-2,YC(epar.XaxisY, ypar)+8);
 Ctx.lineTo(XC(gpar.maxZ, zpar)+6,YC(epar.XaxisY, ypar)+8);
 Ctx.strokeStyle = "black";
 Ctx.stroke();
    
 // Add labels H_0 and H_A
 // First add 'H' above the two curves
 Ctx.font="20px Serif";
 Ctx.fillText("H", XC(0, zpar)-5, YC(1.03,ypar));
 Ctx.fillText("H", XC(epar.ZA, zpar)-5, YC(1.03,ypar));
 // Then add 0 and A on the lower right of the H's
 Ctx.font="15px Serif";
 Ctx.fillText("0", XC(0, zpar)+10, YC(1,ypar));
 Ctx.fillText("A", XC(epar.ZA, zpar)+10, YC(1,ypar));
  
 Ctx.restore();
}


// When rendering, ZSTEP determines the horizontal distance between points:

// RenderFunction() renders the input funtion f(x - offset) on the canvas.
// gpar is an object with the properties minZ, maxZ, min, maxY, Width, 
// and Height.
// epar is an object with the properties offset and color: the function 
// f(x-offset) is plotted with color set by the values of offset and color.
function RenderFunction(Ctx, f, gpar, epar) {
  var ZSTEP = (gpar.maxZ-gpar.minZ)/gpar.Width;
  var first = true;
    
  // setup parameters for the function XC and YC
  var zpar = {"minX":gpar.minZ, "rangeX":gpar.maxZ-gpar.minZ, "Width":gpar.Width};
  var ypar = {"minY":gpar.minY, "rangeY":gpar.maxY-gpar.minY, "Height":gpar.Height};

  Ctx.beginPath();
  for (var z = gpar.minZ; z <= gpar.maxZ; z += ZSTEP) {
   var y = f(z-epar.offset);
   if (first) {
    Ctx.moveTo(XC(z, zpar),YC(y, ypar));
    first = false;
   } else {
    Ctx.lineTo(XC(z, zpar),YC(y, ypar));
   }
  }
  Ctx.strokeStyle = epar.color;
  Ctx.stroke();
}

// Shade the Region under normal curves
// gpar is an object with the properties minZ, maxZ, min, maxY, Width, 
// and Height.
// epar is an object with the properties Zalp, ZA and ttype
function ShadeCurve(Ctx, f, gpar, epar) {
    
// setup parameters for the function XC and YC
var zpar = {"minX":gpar.minZ, "rangeX":gpar.maxZ-gpar.minZ, "Width":gpar.Width};
var ypar = {"minY":gpar.minY, "rangeY":gpar.maxY-gpar.minY, "Height":gpar.Height};

 var npoly = 100;
 var y,z,offset,delta,i;
    
 // For ttype = 2 (two-sided test), draw filled 100-side polygon to the left/right 
 // of -Zalp
 if (epar.ttype==2) {
     if (epar.Zalp > 0) {
         // Draw to the left of -Zalp and draw only if -Zalp > minZ
         if (-epar.Zalp > gpar.minZ) {
             Ctx.fillStyle = 'red';
             var z2 = Math.min(gpar.maxZ, -epar.Zalp);
             delta = (z2 - gpar.minZ)/(npoly-1);
             z = gpar.minZ;
             Ctx.beginPath();
             Ctx.moveTo(XC(z, zpar),YC(0, ypar));
             for (i=0; i<npoly; i++) {
                 z = gpar.minZ + i*delta;
                 y = f(z);
                 Ctx.lineTo(XC(z,zpar), YC(y,ypar));
             }
             Ctx.lineTo(XC(z2,zpar), YC(0,ypar));
             Ctx.closePath();
             Ctx.fill();
         }
     } else {
         // Draw to the right of -Zalp and draw only if -Zalp < maxZ
         if (-epar.Zalp < gpar.maxZ) {
             Ctx.fillStyle = 'red';
             var z1 = Math.max(gpar.minZ, -epar.Zalp)
             delta = (gpar.maxZ - z1)/(npoly-1);
             z = z1;
             Ctx.beginPath();
             Ctx.moveTo(XC(z, zpar),YC(0, ypar));
             for (i=0; i<npoly; i++) {
                 z = z1 + i*delta;
                 y = f(z);
                 Ctx.lineTo(XC(z,zpar), YC(y,ypar));
             }
             Ctx.lineTo(XC(gpar.maxZ,zpar), YC(0,ypar));
            Ctx.closePath();
            Ctx.fill();
          }
     }
 }
 
 // Draw filled 100-side polygon to the right of Zalp
 // Draw only if Zalp < maxZ
 var Zright = gpar.maxZ;
 if (epar.Zalp < gpar.maxZ) {
     if (epar.ZA < 0) {
         offset = epar.ZA;
         Ctx.fillStyle = '#87CEEB';
         if (epar.ttype==2) {
             Zright = Math.min(-epar.Zalp, gpar.maxZ);
         }
     } else {
         offset = 0;
         Ctx.fillStyle = 'red';
     }
     var z1 = Math.max(gpar.minZ, epar.Zalp)
     delta = (Zright - z1)/(npoly-1);
     Ctx.beginPath();
     Ctx.moveTo(XC(z1, zpar),YC(0, ypar));
     for (i=0; i<npoly; i++) {
         z = z1 + i*delta;
         y = f(z-offset);
         Ctx.lineTo(XC(z,zpar), YC(y,ypar));
     }
     Ctx.lineTo(XC(Zright,zpar), YC(0,ypar));
     Ctx.closePath();
     Ctx.fill();
     Ctx.fillStyle = "black";
 }
 
 // Draw filled 100-side polygon to the left of Zalp
 // Draw only if Zalp > minZ
 var Zleft = gpar.minZ;
 if (epar.Zalp > gpar.minZ) {
     if (epar.ZA < 0) {
         offset = 0;
         Ctx.fillStyle = 'red';
     } else {
         offset = epar.ZA;
         Ctx.fillStyle = '#87CEEB';
         if (epar.ttype==2) {
             Zleft = Math.max(-epar.Zalp, gpar.minZ);
         }
     }
     var z2 = Math.min(gpar.maxZ, epar.Zalp)
     delta = (z2 - Zleft)/(npoly-1);
     Ctx.beginPath();
     Ctx.moveTo(XC(Zleft, zpar),YC(0, ypar));
     for (i=0; i<npoly; i++) {
         z = Zleft + i*delta;
         y = f(z-offset);
         Ctx.lineTo(XC(z,zpar), YC(y,ypar));
     }
     Ctx.lineTo(XC(z2,zpar), YC(0,ypar));
     Ctx.closePath();
     Ctx.fill();
     Ctx.fillStyle = "black";
 }


 // Draw vertical line at Zalp if Zalp is in the plotting range
 if (epar.Zalp > gpar.minZ && epar.Zalp < gpar.maxZ) {
     Ctx.strokeStyle = "black";
     Ctx.beginPath();
     Ctx.moveTo(XC(epar.Zalp, zpar), YC(0, ypar));
     Ctx.lineTo(XC(epar.Zalp, zpar), YC(gpar.maxY, ypar));
     Ctx.stroke();
 }
 
 // For ttype=2 (two-sided test), draw vertical line at -Zalp 
 // if -Zalp is in the plotting range
 if (epar.ttype==2 && -epar.Zalp > gpar.minZ && -epar.Zalp < gpar.maxZ) {
     Ctx.strokeStyle = "black";
     Ctx.beginPath();
     Ctx.moveTo(XC(-epar.Zalp, zpar), YC(0, ypar));
     Ctx.lineTo(XC(-epar.Zalp, zpar), YC(gpar.maxY, ypar));
     Ctx.stroke();
 }
}
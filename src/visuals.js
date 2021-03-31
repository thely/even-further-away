import p5 from 'p5';

// var position;
var canvasID;
var canv;
var img;
var capWidth = 40;
var capHeight = 30;
let midThresh = 125;
let socket;
let cycle = 0;

let imgScale = 2;
let allFrames = [];
let frameSeen = [];
let darkColor, lightColor;

let ct = 10;
const total = ct * ct;
let frameCounter = 0;
var counter;
let sendRate = 0;
let sendCounter = 0;
let isReady = false;
let font;
let allTextPoints = [];

const sketch = (p) => {
  document.querySelector(".init-camera").addEventListener("click", () => {
    img = p.createCapture(p.VIDEO, () => {
      isReady = true;
    });
    img.size(capWidth, capHeight);
    img.hide();
  });

  p.preload = () => {
    font = p.loadFont('/assets/TofinoPersonal-Regular.otf');
  }
  p.setup = () => {
    counter = 0;
    canv = p.createCanvas(capWidth * imgScale * ct, capHeight * imgScale * ct);
    canv.parent(canvasID);

    // img = p.createCapture(p.VIDEO, () => {
    //   isReady = true;
    // });
    // img.size(capWidth, capHeight);
    // img.hide();
    
    // position = p.startInsideBounds(capWidth, capHeight);
    
    darkColor = [p.random(0, 127), p.random(0, 127), p.random(0, 127), 255];
    lightColor = [p.random(80, 255), p.random(80, 255), p.random(80, 255), 255];
    // stripColor = [random(255), p.random(255), p.random(255), 255];
    p.pixelDensity(1);
    sendRate = p.random(60, 120);

    socket.emit("switchColors", { stroke: darkColor, fill: lightColor });
    p.stroke(darkColor);
    p.fill(lightColor);

    // p.textAlign(p.RIGHT);
    // addText(p, 'going to the store', darkColor, lightColor);
  }

  p.draw = () => {
    if (!isReady) { return; }
    if (counter % 10 == 0) {
      p.scale(imgScale, imgScale);
      
      let temp = img.get();
      temp.loadPixels();
      temp = alterPixels(p, temp);
      temp.updatePixels();
      addPicture(temp);

      if (sendCounter >= sendRate) {
        sendRate = p.random(80, 150);
        sendCounter = 0;
        const data = { 
          id: socket.id, 
          image: {
            width: temp.imageData.width,
            height: temp.imageData.height,
            data: temp.imageData.data
          }
        };
        socket.emit("newPicture", data);
      }
      
      for (let i = 0; i < allFrames.length; i++) {
        if (frameSeen[i]){
          continue;
        }
        let x = capWidth * (i % ct) + p.random(cycle * -1, cycle);
        let y = capHeight * p.floor(i / ct) + p.random(cycle * -1, cycle);
        p.tint(255, 255, 255, 80);
        p.image(allFrames[i], x, y);
        frameSeen[i] = true;
      }

      for (let i = 0; i < allTextPoints.length; i++) {
        drawText(p, allTextPoints[i]);
      }
      
    }
    counter++;
    sendCounter++;
  }

  socket.on("newPicture", (obj) => {
    console.log("we're getting a picture!");
    console.log(obj.image);
    const newImage = buildImage(p, obj.image);
    addPicture(newImage);
  });
  
  socket.on("parsedSpeech", (msg) => {
    console.log(msg);
    if ("speech" in msg) {
      addText(p, msg);
    } else {
      console.log("no text to put!");
    }  
  });
}

let textIndex = 0;
let maxTexts = 5;
function addText(p, text) {
  let yval = 32 * (textIndex + 1);
  allTextPoints[textIndex] = {};
  allTextPoints[textIndex].points = font.textToPoints(text.speech, p.floor(p.random(8, 25)), yval, 32, {
    sampleFactor: 0.2,
    simplifyThreshold: 0
  });
  allTextPoints[textIndex].fill = text.fill;
  allTextPoints[textIndex].stroke = text.stroke;
  textIndex = (textIndex + 1 >= maxTexts) ? 0 : textIndex + 1;
}

function drawText(p, obj) {
  let points = obj.points;
  p.stroke(obj.stroke);
  p.fill(obj.fill);
  
  p.beginShape();
  for (let i = 0; i < points.length; i++) {
    let point = points[i];
    let x = point.x + p.random(0, 1);
    let y = (p.random(90) >= 87) ? point.y + p.random(-10, 20) : point.y;
    p.vertex(x, y);
  }
  p.endShape();
}

function alterPixels(p, img) {
  const d = p.pixelDensity();

  for (let x = 0; x < img.width; x++) {
    for (let y = 0; y < img.height; y++) {
      const i = 4 * d * (y * d * img.width + x);
      const [r, g, b] = [img.pixels[i], img.pixels[i + 1], img.pixels[i + 2]];
      if (r <= midThresh && b <= midThresh && g <= midThresh) {
        img.pixels[i] =     p.red(darkColor);
        img.pixels[i + 1] = p.green(darkColor);
        img.pixels[i + 2] = p.blue(darkColor);
        img.pixels[i + 3] = p.alpha(darkColor);
      }
      else {
        img.pixels[i] =     p.red(lightColor);
        img.pixels[i + 1] = p.green(lightColor);
        img.pixels[i + 2] = p.blue(lightColor);
        img.pixels[i + 3] = p.alpha(lightColor);
      }
    }  
  }
  return img;
}


function p5Start(canvasID, mySocket) {
  canvasID = canvasID;
  socket = mySocket;
  new p5(sketch);
}

function buildImage(p, imgData) {
  const data = new Uint8ClampedArray(imgData.data);
  let d = p.pixelDensity();
  let blankImage = p.createImage(imgData.width, imgData.height);
  blankImage.loadPixels();

  for (let x = 0; x < imgData.width; x++) {
    for (let y = 0; y < imgData.height; y++) {
      const i = 4 * d * (y * d * imgData.width + x);

      blankImage.pixels[i] = data[i];
      blankImage.pixels[i+1] = data[i+1];
      blankImage.pixels[i+2] = data[i+2];
      blankImage.pixels[i+3] = data[i+3];
    }
  }

  console.log("we made an image!");
  blankImage.updatePixels();
  return blankImage;
}

let isBlocking = false;
function addPicture(img) {
  let i = setInterval(() => {
    if (!isBlocking) {
      isBlocking = true;
      allFrames[frameCounter] = img;
      frameSeen[frameCounter] = false;
      if (frameCounter == total) {
        frameCounter = 0;
        cycle++;
      } else {
        frameCounter++;
      }
      // frameCounter = (frameCounter == total) ? 0 : frameCounter + 1;
      isBlocking = false;
      clearInterval(i);
    }
    else {
      // console.log("it's blocked!");
    }
  }, 100);
}

module.exports = p5Start;
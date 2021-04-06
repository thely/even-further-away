import p5 from 'p5';
import FrameRender from './visuals/FrameRender';
import TextRender from './visuals/TextRender';

// var position;
// var canvasID;
// var canv;
var img;
var capWidth = 40;
var capHeight = 30;
// let midThresh = 125;
let socket;
// let cycle = 0;

let imgScale = 2;
let darkColor, lightColor;

let ct = 10;
// const total = ct * ct;
// let frameCounter = 0;
var counter;
let sendRate = 0;
let sendCounter = 0;
let isReady = false;
// let font;
// let allTextPoints = [];

let s, frameRender, textRender;

const sketch = (p) => {
  s = p;

  p.preload = () => {
    textRender = new TextRender(p, 5);
    // font = p.loadFont('/assets/TofinoPersonal-Regular.otf');
  }
  p.setup = () => {
    counter = 0;
    p.createCanvas(capWidth * imgScale * ct, capHeight * imgScale * ct);
    // canv.parent(canvasID);
    frameRender = new FrameRender(p, capWidth, capHeight, ct);

    darkColor = [p.random(0, 127), p.random(0, 127), p.random(0, 127), 255];
    lightColor = [p.random(80, 255), p.random(80, 255), p.random(80, 255), 255];
    p.pixelDensity(1);
    sendRate = p.random(60, 120);

    // socket.emit("switchColors", { stroke: darkColor, fill: lightColor });
    p.stroke(darkColor);
    p.fill(lightColor);
  }

  p.draw = () => {
    if (!isReady) { return; }
    if (counter % 10 == 0) {
      p.scale(imgScale, imgScale);
      
      let temp = img.get();
      temp.loadPixels();
      temp = frameRender.recolorFrame(temp, { light: lightColor, dark: darkColor });
      temp.updatePixels();
      frameRender.addFrame(temp);

      // sendFrame(p, temp);
      frameRender.drawNextFrames();

      // for (let i = 0; i < allTextPoints.length; i++) {
      //   drawText(p, allTextPoints[i]);
      // }

      // drawTuner(p);
      
    }
    counter++;
    sendCounter++;
  }

  // socket.on("newPicture", (obj) => {
  //   // console.log("we're getting a picture!");
  //   // console.log(obj.image);
  //   const newImage = buildImage(p, obj.image);
  //   addPicture(newImage);
  // });
  
  // socket.on("parsedSpeech", (msg) => {
  //   console.log(msg);
  //   if ("speech" in msg) {
  //     addText(p, msg);
  //   } else {
  //     console.log("no text to put!");
  //   }  
  // });
}

function sendFrame(p, temp) {
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
}


class VisualHandler {
  constructor(canvasID) {
    new p5(sketch, canvasID);
  }

  openCamera() {
    img = s.createCapture(s.VIDEO, () => {
      isReady = true;
    });
    img.size(capWidth, capHeight);
    img.hide();
  }

  sendPicture() {

  }

  // remotePicture() {
  //   const newImage = buildImage(p, obj.image);
  //   addPicture(newImage);
  // }
  
  textFromServer(msg) {
    console.log(msg);
    if ("speech" in msg) {
      textRender.addText(s, msg);
    } else {
      console.log("no text to put!");
    }  
  }
}

export default VisualHandler;

// module.exports = p5Start;
// export { p5Start, updateCanvasTunerPitch };
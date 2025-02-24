import p5 from 'p5';
import * as Tone from "tone";
import FrameRender from './visuals/FrameRender';
import TextRender from './visuals/TextRender';
import ZoomLikeSpace from './visuals/ZoomLikeSpace';

var img;
var capWidth = 40;
var capHeight = 30;
let font;
let imgScale = 2;
let darkColor, lightColor;

let ct = 10;
var counter;
let sendRate = 0;
let sendCounter = 0;
let isReady = false;

let s, frameRender, textRender, zoomSpacer;

let doneCounter;
let myState = {};
p5.disableFriendlyErrors = true;

const sketch = (p) => {
  s = p;

  p.preload = () => {
    font = p.loadFont('/assets/TofinoPersonal-Regular.otf');
  }

  p.windowResized = () => {
    if (parentObj.viewer) {
      p.resizeCanvas(p.windowWidth, p.windowHeight);
      zoomSpacer.generateBlocks(parentObj.userKeys);
      p.background(50);
      Tone.context.resume();
    }
  }

  p.setup = () => {
    counter = 0;
    let myW = p.windowWidth;
    let myH = p.windowHeight;
    
    if (!parentObj.viewer) {
      p.noLoop();
      myW = capWidth * imgScale * ct
      myH = capHeight * imgScale * ct;
    }
    
    p.createCanvas(myW, myH);

    darkColor = [p.random(0, 127), p.random(0, 127), p.random(0, 127), 255];
    lightColor = [p.random(80, 255), p.random(80, 255), p.random(80, 255), 255];
    p.pixelDensity(1);
    sendRate = p.random(60, 120);

    parentObj.sendColors({ stroke: darkColor, fill: lightColor });
    p.stroke(darkColor);
    p.fill(lightColor);

    frameRender = new FrameRender(p, capWidth, capHeight, ct);
    textRender = new TextRender(p, { stroke: darkColor, fill: lightColor }, font, 5);
    zoomSpacer = new ZoomLikeSpace(p, { width: capWidth, height: capHeight });
    
    if (parentObj.userKeys) { // a bit of a hack
      console.log("init for generate");
      zoomSpacer.generateBlocks(parentObj.userKeys);
    }

    if (parentObj.starterFrames) {
      for (let key of Object.keys(parentObj.starterFrames)) {
        const newImage = frameRender.buildFrame(parentObj.starterFrames[key]);
        zoomSpacer.addFrameToBlock(key, newImage);
      }      
    }

    p.background(50);
    p.noSmooth();
    doneCounter = 0;
  }

  p.draw = () => {
    if (!isReady) { return; }
    if (counter % 10 == 0) {
      if ("bigText" in myState) {
        textRender.drawLoudText(myState.bigText);
        return;
      }

      if (!parentObj.viewer) {
        let temp = img.get();
        temp.loadPixels();
        temp = frameRender.recolorFrame(temp, { light: lightColor, dark: darkColor });
        temp.updatePixels();
        
        frameRender.addFrame(temp);
        zoomSpacer.addFrameToBlock(parentObj.socket.id, temp);
        sendFrame(p, temp);
      }  
      
      if ("tinyBlocks" in myState) {
        frameRender.drawNextFrames();
      }

      zoomSpacer.drawBlocks(myState);
      textRender.drawAllText();

      if (parentObj.finished) {
        console.log(doneCounter);
        p.background(0, 0, 0, doneCounter * 10);
        doneCounter++;
  
        if (doneCounter * 10 >= 255) {
          p.noLoop();
        }
      }
    }
    counter++;
    sendCounter++;
    
  //   let fps = p.frameRate();
  // p.fill(255);
  // p.stroke(0);
  // p.text("FPS: " + fps.toFixed(2), 10, p.height - 10);
  }
  p.doubleClicked = () => {
    if (p.mouseX > 0 && p.mouseX < p.width && p.mouseY > 0 && p.mouseY < p.height) {
      let fs = p.fullscreen();
      p.fullscreen(!fs);
    }
  }
}

function sendFrame(p, temp) {
  if (sendCounter >= sendRate) {
    sendRate = p.random(40, 100);
    sendCounter = 0;
    const data = { 
      id: parentObj.socket.id, 
      image: {
        width: temp.imageData.width,
        height: temp.imageData.height,
        data: temp.imageData.data
      }
    };

    parentObj.sendPicture(data);
  }
}

let parentObj;
class VisualHandler {
  constructor(canvasID, socket, options) {
    parentObj = this;
    this.socket = socket;
    this.finished = false;
    this.starterFrames = [];
    if (options != null && "viewer" in options) {
      this.viewer = true;
      isReady = true;
    } else {
      this.viewer = false;
    }

    if (options != null && "images" in options && options.images != []) {
      this.starterFrames = options.images;
    }

    new p5(sketch, canvasID);

  }

  openCamera() {
    img = s.createCapture(s.VIDEO, () => {
      isReady = true;
      s.loop();
    });
    img.size(capWidth, capHeight);
    img.hide();
  }

  sendPicture(data) {
    this.socket.emit("newPicture", data);
  }

  sendColors(colors) {
    this.socket.emit("switchColors", colors);
  }

  usersChange(userKeys) {
    // console.log("userschange");
    this.userKeys = userKeys;
    if (zoomSpacer) {
      console.log("usersChange for generate");
      zoomSpacer.generateBlocks(userKeys);
    }
  };

  frameFromServer(obj) {
    if (frameRender) {
      const newImage = frameRender.buildFrame(obj.image);
      if (zoomSpacer) {
        zoomSpacer.addFrameToBlock(obj.id, newImage);
      }
    } else {
      console.log("frameRender doesn't exist yet");
    }
  }
  
  textFromServer(msg) {
    if (textRender) {
      console.log(msg);
      if ("speech" in msg) {
        textRender.addText(msg);
      } else {
        console.log("no text to put!");
      }  
    } else {
      console.log("textRender doesn't exist yet");
    }
  }

  deleteAll() {
    s.noLoop();
    if (zoomSpacer) {
      zoomSpacer.deleteAll();
    }
    textRender.reset();
  }

  reset() {
    textRender.reset();
  }

  fadeOut() {
    console.log("fading out");
    this.finished = true;
  }

  clearBoard() {
    console.log("clearing board");
    this.finished = false;
    doneCounter = 0;
    textRender.reset();
    s.background(50);
    s.loop();
  }

  handleStateChange(state) {
    myState = state;
    textRender.handleStateChange(state);
  }
}

export default VisualHandler;

// module.exports = p5Start;
// export { p5Start, updateCanvasTunerPitch };
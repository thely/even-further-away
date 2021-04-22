let p;

class FrameRender {
  constructor(s, w, h, ct) {
    p = s;
    this.frames = [];
    this.seen = [];
    this.dim = { w: w, h: h, ct: ct, cols: p.width / w, rows: p.height / h };
    this.pos = { x: 0, y: 0 };
    this.thresh = 125; // color threshold
    this.blocking = false;

    this.state = {
      count: 0,
      max: ct * ct,
      cycle: 0
    }
  }

  drawNextFrames() {
    for (let i = 0; i < this.frames.length; i++) {
      if (this.seen[i]){
        continue;
      }

      let x = this.pos.x * this.dim.w;
      let y = this.pos.y * this.dim.h;
      // let x = this.dim.w * (i % this.dim.ct) + p.random(this.state.cycle * -1, this.state.cycle);
      // let y = this.dim.h * p.floor(i / this.dim.ct) + p.random(this.state.cycle * -1, this.state.cycle);
      p.tint(255, 255, 255, 80);
      p.image(this.frames[i], x, y);
      this.seen[i] = true;
      this.pos.y = (this.pos.x >= this.dim.cols) ? this.pos.y + 1 : this.pos.y;
      this.pos.y = (this.pos.y >= this.dim.rows) ? 0 : this.pos.y;
      this.pos.x = (this.pos.x >= this.dim.cols) ? 0 : this.pos.x + 1;
      
    }
  }

  drawNextFramesFixed() {
    for (let i = 0; i < this.frames.length; i++) {
      if (this.seen[i]){
        continue;
      }
      let x = this.dim.w * (i % this.dim.ct) + p.random(this.state.cycle * -1, this.state.cycle);
      let y = this.dim.h * p.floor(i / this.dim.ct) + p.random(this.state.cycle * -1, this.state.cycle);
      p.tint(255, 255, 255, 80);
      p.image(this.frames[i], x, y);
      this.seen[i] = true;
    }
  }

  // from the performer side, recolor image
  recolorFrame(img, colors) {
    const d = p.pixelDensity();
  
    for (let x = 0; x < img.width; x++) {
      for (let y = 0; y < img.height; y++) {
        const i = 4 * d * (y * d * img.width + x);
        const [r, g, b] = [img.pixels[i], img.pixels[i + 1], img.pixels[i + 2]];
        if (r <= this.thresh && b <= this.thresh && g <= this.thresh) {
          img.pixels[i] =     p.red(colors.dark);
          img.pixels[i + 1] = p.green(colors.dark);
          img.pixels[i + 2] = p.blue(colors.dark);
          img.pixels[i + 3] = p.alpha(colors.dark);
        }
        else {
          img.pixels[i] =     p.red(colors.light);
          img.pixels[i + 1] = p.green(colors.light);
          img.pixels[i + 2] = p.blue(colors.light);
          img.pixels[i + 3] = p.alpha(colors.light);
        }
      }  
    }
    return img;
  }

  // taking Uint8Clamped sent in from the server, turn it into a p5 image
  buildFrame(imgData) {
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

    this.addFrame(blankImage);
    return blankImage;
  }

  // add a new frame to the stack
  // called both by the performer and the server, so blocking is involved
  addFrame(img) {
    let i = setInterval(() => {
      if (!this.blocking) {
        this.blocking = true;
        this.frames[this.state.count] = img;
        this.seen[this.state.count] = false;
        if (this.state.count == this.state.max) {
          this.state.count = 0;
          this.state.cycle++;
        } else {
          this.state.count++;
        }
        // frameCounter = (frameCounter == total) ? 0 : frameCounter + 1;
        this.blocking = false;
        clearInterval(i);
      }
      else {
        // console.log("it's blocked!");
      }
    }, 100);
  }
}

export default FrameRender;
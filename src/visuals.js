import p5 from 'p5';

let capture;
let counter = 0;
let position;

const sketch = (p) => {
  p.setup = () => {
    p.createCanvas(1000, 800);
    p.noStroke();
    capture = p.createCapture(p.VIDEO);
    capture.size(320, 240);
    capture.hide();
    position = startInsideBounds(p, 320, 240);
    p.pixelDensity(1);
  }

  p.draw = () => {
    if (counter % 10 == 0) {
      p.background(255);
      capture.loadPixels();
      capture = alterPixels(capture);
      capture.updatePixels();
      p.image(capture, 0, 0, 320, 240);
      p.filter(p.THRESHOLD);
      // p.tint(0, 153, 204, 126);
    }
    counter++;
    
    // let spectrum = fft.analyze();
    
    // p.beginShape();
    // drawSpectrum(p, spectrum);
    // p.endShape();
  }
}

function startInsideBounds(p, w, h) {
  let x = p.int(p.random(p.width - w));
  let y = p.int(p.random(p.height - h));

  return {
    x: x,
    y: y
  };
}

function p5Start() {
  new p5(sketch);
}

module.exports = p5Start;
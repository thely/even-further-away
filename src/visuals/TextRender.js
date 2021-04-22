let p;

class TextRender {
  constructor(s, colors, font, max) {
    p = s;
    this.colors = colors;
    this.font = font;
    this.texts = [];
    this.index = 0;
    this.max = (max) ? max : 5;
    this.state = {};
    
    this.lossyThresh = 10;
    this.rotation = 0;
    this.offset = 0;
  }
  
  addText(text) {
    const fontSize = 64;
    let yval = fontSize * (this.index + 1);
    const points = this.font.textToPoints(text.speech, p.floor(p.random(8, 25)), yval, fontSize, {
      sampleFactor: 0.2,
      simplifyThreshold: 0
    });

    this.texts[this.index] = {
      points: points,
      fill: text.fill,
      stroke: text.stroke
    };

    this.index = (this.index + 1 >= this.max) ? 0 : this.index + 1;
  }

  drawAllText() {
    for (let i = 0; i < this.texts.length; i++) {
      this.drawText(this.texts[i]);
    }
  }

  drawText(obj) {
    const points = obj.points;
    p.stroke(obj.stroke);
    p.fill(obj.fill);
    
    p.push();
    if (this.rotation) {
      p.rotate(p.PI / this.rotation);
    }
    if (this.offset) {
      p.translate(0, this.offset);
    }
    
    p.beginShape();
    for (let i = 0; i < points.length; i++) {
      if (p.random(0, 10) >= this.lossyThresh) continue;
      let point = points[i];
      let x = point.x + p.random(0, 1);
      let y = (p.random(90) >= 87) ? point.y + p.random(-10, 20) : point.y;
      p.vertex(x, y);
    }
    p.endShape();
    p.pop();
  }

  drawLoudText(text) {
    p.push();
    p.textSize(100);
    p.textLeading(80);
    p.strokeWeight(15);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(text, 0, 0, p.width, p.height);
    p.pop();
  }

  handleStateChange(state) {
    // this.state = state;
    if ("textLossyThresh" in state) {
      this.lossyThresh = state.textLossyThresh;
    }
    if ("textRotation" in state) {
      this.rotation = state.textRotation;
    }
    if ("textOffset" in state) {
      this.offset = state.textOffset;
    }
  }
}

export default TextRender;
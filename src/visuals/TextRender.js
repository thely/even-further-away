let p;

class TextRender {
  constructor(s, colors, font, max) {
    p = s;
    this.colors = colors;
    this.font = font;
    this.texts = [];
    this.index = 0;
    this.max = (max) ? max : 5;
  }
  
  addText(text) {
    let yval = 32 * (this.index + 1);
    const points = this.font.textToPoints(text.speech, p.floor(p.random(8, 25)), yval, 32, {
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
    
    p.beginShape();
    for (let i = 0; i < points.length; i++) {
      let point = points[i];
      let x = point.x + p.random(0, 1);
      let y = (p.random(90) >= 87) ? point.y + p.random(-10, 20) : point.y;
      p.vertex(x, y);
    }
    p.endShape();
  }
}

export default TextRender;
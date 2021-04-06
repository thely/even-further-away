// let textIndex = 0;
// let maxTexts = 5;
let p;

class TextRender {
  constructor(s, max) {
    p = s;
    this.font = s.loadFont('/assets/TofinoPersonal-Regular.otf');
    this.texts = [];
    this.index = 0;
    this.max = (max) ? max : 5;
  }
  
  addText(p, text) {
    let yval = 32 * (this.index + 1);
    
    const points = this.font.textToPoints(text.speech, p.floor(p.random(8, 25)), yval, 32, {
      sampleFactor: 0.2,
      simplifyThreshold: 0
    });
    console.log('making points');
    console.log(points);

    this.texts[this.index] = {
      points: points,
      // fill: text.fill,
      // stroke: text.stroke
    };
    // this.texts[this.index].fill = text.fill;
    // this.texts[this.index].stroke = text.stroke;
    this.index = (this.index + 1 >= this.max) ? 0 : this.index + 1;
  }

  drawAllText() {
    for (let i = 0; i < this.texts.length; i++) {
      // console.log
      this.drawText(p, this.texts[i]);
    }
  }

  drawText(obj) {
    let points = obj.points;
    console.log("points?");
    console.log(points);
    // p.stroke(obj.stroke);
    // p.fill(obj.fill);
    
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
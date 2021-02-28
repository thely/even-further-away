import p5 from 'p5';
import './../lib/p5.sound.min.js';

let carAmpSlider, carFreqSlider, amAmpSlider, amFreqSlider, fmAmpSlider, fmFreqSlider;
let carMenu, amMenu, fmMenu, carFreq;
const car = new p5.Oscillator();
const am = new p5.Oscillator();
const fm = new p5.Oscillator();
const fmLFO = new p5.Oscillator();

const gain = new p5.Gain();
const fft = new p5.FFT();

const sketch = (p) => {
  p.setup = () => {
    p.createCanvas(400, 200);
    p.noStroke();

    carFreq = 440;

    car.setType('sine');
    am.setType('sine');
    fm.setType('sine');
    fmLFO.setType('sine');

    am.disconnect()
    fm.disconnect()
    car.disconnect()
    gain.connect()

    am.amp(0);
    am.freq(1);
    fm.amp(0);
    fm.freq(1);
    fmLFO.amp(1);
    fmLFO.freq(10);
  
    gain.amp(0);

    car.freq(carFreq);
    car.amp(1);
    car.amp(am);
    car.freq(fm);
    fm.freq(fmLFO);

    am.start();
    fm.start();
    car.start();
    fmLFO.start();

    gain.setInput(car);

    buildSliders(p);
  }

  p.draw = () => {
    p.background(80)
    p.fill(255)
    let spectrum = fft.analyze();
    
    p.beginShape();
    drawSpectrum(p, spectrum);
    p.endShape();
  }
}

function drawSpectrum(p, spectrum) {
  p.vertex(0, p.height);
    for (let i = 0; i < spectrum.length; i++) {
      p.vertex(
        p.log(i) * p.width / p.log(spectrum.length),
        p.map(spectrum[i], 0, 255, p.height, 0));
    }
    p.vertex(p.width, p.height);
}

function buildSliders(p) {
  carMenu = p.createSelect().changed(() => {
    car.setType(carMenu.value())
  }).position(10, 10)
  carMenu.option('sine')
  carMenu.option('triangle')
  carMenu.option('square')
  carMenu.option('sawtooth')

  amMenu = p.createSelect().changed(() => {
    am.setType(amMenu.value())
  }).position(10, 60)
  amMenu.option('sine')
  amMenu.option('triangle')
  amMenu.option('square')
  amMenu.option('sawtooth')

  fmMenu = p.createSelect().changed(() => {
    fm.setType(fmMenu.value())
  }).position(10, 110)
  fmMenu.option('sine')
  fmMenu.option('triangle')
  fmMenu.option('square')
  fmMenu.option('sawtooth')

  carAmpSlider = p.createSlider(-60, 0, -60, 0).input(() => {
    gain.amp(p.pow(10, carAmpSlider.value() / 20) - 0.001, 0.1)
  }).position(100, 10)

  carFreqSlider = p.createSlider(0, 130, 40, 0).input(() => {
    carFreq = p.midiToFreq(carFreqSlider.value())
    fm.amp(p.map(fmAmpSlider.value(), 0, 1, 0, carFreq), 0.1)
    car.freq(carFreq, 0.1)
  }).position(100, 30)

  amAmpSlider = p.createSlider(0, 1, 0, 0).input(() => {
    am.amp(amAmpSlider.value(), 0.1)
  }).position(100, 60)

  amFreqSlider = p.createSlider(-50, 80, -36, 0).input(() => {
    am.freq(p.midiToFreq(amFreqSlider.value()), 0.1)
  }).position(100, 80)

  fmAmpSlider = p.createSlider(0, 1, 0, 0).input(() => {
    fm.amp(p.map(fmAmpSlider.value(), 0, 1, 0, carFreq), 0.1)
  }).position(100, 110)

  fmFreqSlider = p.createSlider(-50, 80, -36, 0).input(() => {
    fm.freq(p.midiToFreq(fmFreqSlider.value()), 0.1);
    fm.freq(fmLFO);
  }).position(100, 130)
}

new p5(sketch);
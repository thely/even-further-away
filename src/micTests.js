import * as Tone from 'tone';

let C2 = 65.41;
let notes = [ "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B" ];
let test_frequencies = [];
for (let i = 0; i < 30; i++) {
  let freq = C2 * Math.pow(2, i / 12);
  let name = notes[i % 12];
  let note = { "frequency": freq, "name": name };
  test_frequencies.push(note);
}



const meter = new Tone.Meter();
const mic = new Tone.UserMedia();
const analysis = new Tone.Analyser("fft", 16);

mic.connect(meter);
mic.connect(analysis);

let recSet = [];


// import * as Tone from "tone";
let Tone;

class BwommSynth {
  constructor(toneRef) {
    Tone = toneRef;
    this.buildBwomm();
  }

  buildBwomm() {
    this.synth = new Tone.FMSynth({
      "volume": 0,
      "detune": 0,
      "portamento": 0,
      "harmonicity": 2.1,
      "oscillator": {
        "partialCount": 0,
        "partials": [],
        "phase": 0,
        "type": "square"
      },
      "envelope": {
        "attack": 0.01,
        "attackCurve": "linear",
        "decay": 0.2,
        "decayCurve": "exponential",
        "release": 0.5,
        "releaseCurve": "exponential",
        "sustain": 1
      },
      "modulation": {
        "partialCount": 0,
        "partials": [],
        "phase": 0,
        "type": "square"
      },
      "modulationEnvelope": {
        "attack": 0.2,
        "attackCurve": "linear",
        "decay": 0.01,
        "decayCurve": "exponential",
        "release": 0.01,
        "releaseCurve": "exponential",
        "sustain": 1
      },
      "modulationIndex": 10
    });
    this.autoFilter = new Tone.AutoFilter("4n").toDestination();
    // route an oscillator through the filter and start it
    this.synth.chain(this.autoFilter);
    // this.synth = new Tone.NoiseSynth({ volume: -20 });
    // this.filter = new Tone.Filter(8000, "highpass");
    // this.bitcrush = new Tone.BitCrusher(4);
    // this.autoPanner = new Tone.AutoPanner("1n");
    // this.synth.chain(this.bitcrush, this.filter, this.autoPanner, Tone.Destination);
  }

  playBwomm(time) {
    // this.filter.frequency.value = Math.random() * 7000 + 4000;
    // this.bitcrush.wet.value = Math.min(Math.random() + 0.5, 1);
    // this.synth.volume.value = Math.random() * -20 - 10;
  
    this.synth.triggerAttackRelease("G1", 4);
  }

  handleStateChange(state) {
    console.log("we're in bwomm");
    console.log(state);
    if ("bwomm" in state) {
      console.log("we're bwomm!");
      this.playBwomm(Tone.now());
    } 
  }
  destroy() {
    this.synth.volume.value = 0;

    this.synth.dispose();
    this.autoFilter.dispose();
  }
}

export default BwommSynth;
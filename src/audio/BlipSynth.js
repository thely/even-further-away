// import * as Tone from "tone";
let Tone;

class BlipSynth {
  constructor(toneRef) {
    // console.log(toneRef);
    Tone = toneRef;
    console.log(Tone);
    this.buildBlip();
    this.burst = {
      happening: false,
      max: 5,
      count: 0,
      probability: 5
    };
  }

  buildBlip() {
    this.synth = new Tone.NoiseSynth({ volume: -20 });
    this.filter = new Tone.Filter(8000, "highpass");
    this.bitcrush = new Tone.BitCrusher(4);
    this.autoPanner = new Tone.AutoPanner("1n").toDestination();
    console.log("prov?");
    this.synth.chain(this.bitcrush, this.filter, this.autoPanner);
  }

  playBlip(time) {
    this.filter.frequency.value = Math.random() * 7000 + 4000;
    this.bitcrush.wet.value = Math.min(Math.random() + 0.5, 1);
    this.synth.volume.value = Math.random() * -20 - 10;
  
    this.synth.triggerAttackRelease(0.005, time + 0.01);
  }

  handleStateChange(state) {
    if ("blip" in state) {
      this.blipPeriod(state.blip);
    }
  }

  blipPeriod({ start, duration, frequency, max, prob }) {
    Tone.Transport.scheduleRepeat((time) => {
      this.blipBurst(Tone.now(), max, prob);
    }, frequency, start, duration);
  }

  blipBurst(time, blipMax, blipProbability) {
    this.burst.max = blipMax;
    this.burst.probability = blipProbability;
    const randval = Math.random() * 10;
    console.log(blipProbability);

    if (randval >= this.burst.probability && !this.burst.happening) {
      // console.log("about to schedule burst repeat");
      this.burst.happening = true;
      this.burst.count = this.burst.max;
      const ref = this;

      const cancelMe = Tone.Transport.scheduleRepeat((time2) => {
        // console.log("burst repeat");
        if (ref.burst.count <= 0) {
          ref.burst.happening = false;
          Tone.Transport.clear(cancelMe);
        }

        if (Math.random() * 10 >= 4) {
          this.playBlip(time2);
          this.burst.count--;
        }
      }, "16n", Tone.Transport.position, 10);
    }
  }
  destroy() {
    this.synth.volume.value = 0;

    this.synth.dispose();
    this.filter.dispose();
    this.bitcrush.dispose();
    this.autoPanner.dispose();
  }
}

export default BlipSynth;
import * as Tone from "tone";

class BlipSynth {
  constructor() {
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
    this.autoPanner = new Tone.AutoPanner("1n");
    this.synth.chain(this.bitcrush, this.filter, this.autoPanner, Tone.Destination);
  }

  playBlip(time) {
    this.filter.frequency.value = Math.random() * 7000 + 4000;
    this.bitcrush.wet.value = Math.min(Math.random() + 0.5, 1);
    this.synth.volume.value = Math.random() * -20 - 10;
  
    this.synth.triggerAttackRelease(0.005, time + 0.01);
  }

  // let burst = 5;
  // let burstHappening = false;
  blipBurst(time, blipMax, blipProbability) {
    this.burst.max = blipMax;
    this.burst.probability = blipProbability;
    const randval = Math.random() * 10;

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
}

export default BlipSynth;
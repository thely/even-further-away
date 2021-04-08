import * as Tone from "tone";
const { updateSingleMeter } = require("./controls.js");

class UserSynth {
  constructor(id) {
    this.id = id;
    this.singer = this.buildSinger();
    this.repeater = this.buildRepeater();
    this.repeaterEvent = -1;
    this.state = {};
  }

  destroy() {
    this.singer.channel.volume.value = 0;
    this.repeater.channel.volume.value = 0;
    for (let piece of Object.keys(this.singer)) {
      this.singer[piece].dispose();
    }
    for (let piece of Object.keys(this.repeater)) {
      this.repeater[piece].dispose();
    }
  }


// ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-
// Play pitches back
// ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-

  playSinger(msg, blipFunc, state) {
    // console.log(msg);
    let synth = this.singer.synth;
    if ("harmonicity" in msg) {
      synth.harmonicity.setValueAtTime(msg.harmonicity, Tone.now());
    } 
    if ("modulationIndex" in msg) {
      synth.modulationIndex.rampTo(msg.modulationIndex.value, msg.modulationIndex.duration, Tone.now());
    }
    if ("volume" in msg) {
      synth.volume.rampTo(msg.volume, 0.01, Tone.now());
    }
    if (msg.event == "start") {
      synth.triggerAttack(msg.pitch, Tone.now());
    } else if (msg.event == "transition") {
      synth.frequency.rampTo(msg.pitch, 0.03, Tone.now());
    } else if (msg.event == "end") {
      synth.triggerRelease(Tone.now());
    }

    // if (msg.pitch == null && state.noiseWhileSpeaking && Math.random() * 10 >= 6) {
    //   blipFunc(Tone.now());
    // }

    // updateSingleMeter(this.singer.meter.getValue(), this.id);
  }

  get singerVolume() {
    return this.singer.meter.getValue();
  }

  handleStateChange(state) {
    console.log("synth change state");
    console.log(state);
    this.state = state;

    if (!("repeater" in state)) {
      console.log('no repeater');
      if (this.repeaterEvent != -1) {
        Tone.Transport.clear(this.repeaterEvent);
        this.repeaterEvent = -1;
      }
      return;
    }
  }

  playPattern(pitches, duration) {
    console.log(this.state);
    if (!("repeater" in this.state)) {
      console.log('no repeater');
      if (this.repeaterEvent != -1) {
        Tone.Transport.clear(this.repeaterEvent);
        this.repeaterEvent = -1;
      }
      return;
    }
    
    if (this.repeaterEvent != -1) {
      Tone.Transport.clear(this.repeaterEvent);
    }
  
    this.repeaterEvent = Tone.Transport.scheduleRepeat((time) => {
      this.repeater.synth.start(time).stop(time + duration);
      this.repeater.synth.frequency.setValueCurveAtTime(pitches, time, duration);
      console.log(Tone.Transport.position);
    }, "2m", Tone.Transport.position);
  
    // return eventNum;
  }

  rePan(val) {
    this.singer.channel.pan.value = val;
    this.repeater.channel.pan.value = val;
  }


// ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-
// Create synths
// ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-

  buildSinger() {
    let synth = new Tone.FMSynth({
      frequency: 200,
      oscillator: {
        type: "sawtooth",
        partialCount: 2,
      },
      modulationIndex: 100,
      modulation: {
        frequency: 4,
        type: "square",
      },
      modulationEnvelope: {
        attack: 2,
        attackCurve: "linear",
        decay: 0.1,
        decayCurve: "exponential",
        release: 1,
        releaseCurve: "exponential",
        sustain: 1
      },
      modulationEnvelope: {
        attack: 0.1,
        attackCurve: "linear",
        decay: 0.1,
        decayCurve: "exponential",
        release: 1,
        releaseCurve: "exponential",
        sustain: 1
      },
    });
    const filter = new Tone.Filter({
      frequency: 2000, 
      type: "lowpass",
      Q: 2,
      rolloff: -24
    });
    const bitcrush = new Tone.Distortion(0.5);
    // const mult = new Tone.Multiply(1.0);
    const comp = new Tone.Compressor(-20, 2);
    const chorus = new Tone.Chorus(4, 2.5, 0.5);
    const mult = new Tone.Multiply(3);
    const channel = new Tone.Channel(-12, -0.2).toDestination();
    const meter = new Tone.Meter({ channels: 2 });
    synth.chain(bitcrush, filter, comp, chorus, mult, channel);
    channel.connect(meter);

    return { 
      synth: synth, 
      distortion: bitcrush, 
      filter: filter, 
      channel: channel, 
      comp: comp, 
      chorus: chorus,
      meter: meter
    };
  }

  buildRepeater() {
    const synth = new Tone.Oscillator({ type: "triangle", volume: -20 });
    const feedbackDelay = new Tone.FeedbackDelay("8n", 0.5).toDestination();
    const filter = new Tone.Filter(3000, "highpass");
    const channel = new Tone.Channel(-12, -0.2).toDestination();
    synth.chain(feedbackDelay, filter, channel);

    return {
      synth: synth,
      delay: feedbackDelay,
      filter: filter,
      channel: channel
    };
  }
}

export default UserSynth;
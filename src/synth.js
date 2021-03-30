import * as Tone from 'tone';
const { updateSingleMeter } = require("./controls.js");

// ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-
// Play pitches back
// ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-

function playSound(msg, sound, id) {
  // console.log(msg);
  let synth = sound.synth;
  if ("harmonicity" in msg) {
    synth.harmonicity.setValueAtTime(msg.harmonicity, Tone.context.currentTime);
  } 
  if ("modulationIndex" in msg) {
    synth.modulationIndex.rampTo(msg.modulationIndex.value, msg.modulationIndex.duration, Tone.context.currentTime);
  }
  if ("volume" in msg) {
    // console.log(sound.volumeMult);
    // let val = msg.volume * sound.volumeMult;
    synth.volume.rampTo(msg.volume, 0.01, Tone.context.currentTime);
  }
  if (msg.event == "start") {
    synth.triggerAttack(msg.pitch, Tone.context.currentTime);
  } else if (msg.event == "transition") {
    synth.frequency.rampTo(msg.pitch, 0.01, Tone.context.currentTime);
  } else if (msg.event == "end") {
    synth.triggerRelease(Tone.context.currentTime);
  }

  // console.log(sound.channel.volume.value);
  console.log(sound.meter.getValue());
  updateSingleMeter(sound.meter.getValue(), id);
  // updateSingleMeter(sound.meter.getValue(), id);
}

// let meterParent = document.getElementById("user-meters");
// function updateMeter(vol, id) {
//   let val = rangeScale(vol, -30.0, 3.0, 0.0, 1.0);
//   const event = new CustomEvent('meterChange', { 
//     detail: {
//       id: id,
//       value: val * 100
//     }
//   });
//   meterParent.dispatchEvent(event);
// }

// function rangeScale(input, oldmin, oldmax, newmin, newmax) {
//   let percent = (input - oldmin) / (oldmax - oldmin);
//   let output = percent * (newmax - newmin) + newmin;
//   return output;
// }


// ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-
// Synth declaration
// ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-

function newSynth() {
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
  const channel = new Tone.Channel(-12, -0.2).toDestination();
  const meter = new Tone.Meter({ channels: 2 });
  synth.chain(bitcrush, filter, comp, channel);
  channel.connect(meter);

  return { 
    synth: synth, 
    distortion: bitcrush, 
    filter: filter, 
    channel: channel, 
    comp: comp, 
    meter: meter
  };
}

export { newSynth, playSound };
let Tone;

class MasterSynth {
  constructor(toneRef){
    Tone = toneRef;
  }

  buildSinger(fmList) {
    //fmList is a list of FMSynths

    

    const bitcrush = new Tone.Distortion(0.5);
    // const comp = new Tone.Compressor(-20, 2);
    // const chorus = new Tone.Chorus(4, 2.5, 0.5);
    // const mult = new Tone.Multiply(3);
    const channel = new Tone.Channel(-12, -0.2).toDestination();
    const meter = new Tone.Meter({ channels: 2 });
    synth.chain(bitcrush, filter, channel);
    channel.connect(meter);

    return { 
      synth: synth, 
      distortion: bitcrush, 
      filter: filter, 
      channel: channel, 
      // comp: comp, 
      // chorus: chorus,
      meter: meter
    };
  }

  buildRepeater() {
    // const synth = new Tone.Oscillator({ type: "triangle", volume: -20 });
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

export default MasterSynth;
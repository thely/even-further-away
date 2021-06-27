// import * as Tone from "tone";
import { randomInRange } from "../utils.js";
const { detect } = require('detect-browser');
const Pitchfinder = require("pitchfinder");
let Tone;

class MicInput {
  constructor(userID, toneRef) {
    Tone = toneRef;
    this.mic = new Tone.UserMedia();
    this.mult = new Tone.Multiply(12);
    this.meter = new Tone.Meter();
    this.analysis = new Tone.Waveform(1024);

    this.mic.connect(this.mult);
    this.mult.fan(this.meter, this.analysis);

    this.codec = this.setMimeType();
    this.fft = new Pitchfinder.YIN();
    this.pitch = {
      happening: false,
      stopCount: 0,
      changeCount: 0
    }
    this.id = userID;
  }

  destroy() {
    this.mic.dispose();
    this.mult.dispose();
    this.meter.dispose();
    this.analysis.dispose();
  }

  changeMicState(analysisCallback) {
    if (this.mic.state == "stopped") {
      Tone.context.resume();

      return this.mic.open().then(() => {
        // start recorder
        this.recorder = new Tone.Recorder({ mimeType: this.codec });
        this.mic.connect(this.recorder);
        
        // analyze pitch
        this.micInterval = setInterval(() => {
          this.analyzeInputs(analysisCallback);
        }, 100);
        return true;
      }).catch(e => {
        console.log("something failed");
        console.log(e);
      });
    } else {
      this.mic.close();
      clearInterval(this.micInterval);
      return false;
    }
  }

  analyzeInputs(analysisCallback) {
    let pitch = this.fft(this.analysis.getValue());
    let retval = "";
    if (pitch < 10000) {
      if (this.pitch.happening && pitch != null) {
        retval = { event: "transition", pitch: pitch, time: Tone.context.currentTime + 0.01 };
      } else {
        this.pitch.happening = true;
        let harmon = randomInRange(4, 1);
        retval = { event: "start", pitch: pitch, time: Tone.context.currentTime, harmonicity: harmon };
      }
    
      retval.volume = this.meter.getValue(); 

      if (this.pitch.changeCount % 5 == 0 && this.pitch.changeCount != 0) {
        let newmod = randomInRange(60, 2);
        retval.modulationIndex = { value: newmod, duration: 0.5 };
      }

      this.pitch.changeCount++;

    } else {
      this.pitch.stopCount++;
      if (this.pitch.stopCount > 3 && this.pitch.happening) {
        this.pitch.stopCount = 0;
        this.pitch.changeCount = 0;
        this.pitch.happening = false;
        retval = { event: "end", time: Tone.context.currentTime };
      }   
    }

    if (retval != "") {
      retval.id = this.id;
      analysisCallback(retval);
      return retval;
    }
  }

  startRecording() {
    if (this.recorder.state == "stopped") {
      this.recorder.start();
    }
  }

  async stopRecording() {
    if (this.recorder.state == "started") {
      const rec = await this.recorder.stop();
      return { blob: rec, codec: this.codec };
    }
  }

  setMimeType() {
    const browser = detect();
    if (browser.name == 'firefox') {
      return "audio/ogg;codecs=opus";
    } else {
      return "audio/webm";
    }
  }
}

export default MicInput;
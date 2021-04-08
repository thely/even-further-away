import * as Tone from "tone";

class PieceManager {
  constructor() {
    this.flags = {
      useRepeater: false,
      noiseWhileSpeaking: false,
      noiseAsBGBursts: false,
    };

    this.dirBox = document.querySelector(".directions");
  }

  // startTransport() {
  
  //   this.startPiece();
  // }

  pieceText(text) {
    this.dirBox.innerHTML = text;
  }

  startPiece(blipSynth) {
    Tone.Transport.start();
  // burstHappening = false;

    Tone.Transport.scheduleRepeat((time) => {
      // console.log("first section");
      // pieceState.useRepeater = true;
      blipSynth.blipBurst(time, 3, 7);
      this.pieceText("Speak only one word at a time, and record any time you speak.");
    }, "1n", 0.1, 60);

    Tone.Transport.scheduleRepeat((time) => {
      console.log("in section two");
      this.flags.useRepeater = true;
      blipSynth.blipBurst(time, 5, 6);
      this.pieceText("Speak three words at a time. When you record, you should hear yourself back in a different synth.");
    }, "2n", 60.1, 60);

    Tone.Transport.scheduleRepeat((time) => {
      console.log("section 3");
      blipSynth.blipBurst(time, 6, 5);
      this.flags.noiseWhileSpeaking = true;
      this.pieceText("Talk frequently in a normal voice. Record yourself intermittently, for ~3 words at a time.");
    }, "2n", 120.1, 60);
  }
}

export default PieceManager;
// import * as Tone from "tone";
let Tone;

class PieceManager {
  constructor(socket, toneRef) {
    Tone = toneRef;
    this.socket = socket;
    this.inProgress = false;

    this.sectionIndex = 0;
    this.state = this.buildState();

    this.listeners = [];
    this.dirBox = document.querySelector(".directions");
  }

  notifyListeners(section) {
    for (const listen of this.listeners) {
      listen.handleStateChange(section);
    }
  }

  registerListener(listen) {
    this.listeners.push(listen);
  }

  reset() {
    this.listeners = [];
    this.sectionIndex = 0;
  }

  pieceText(text) {
    this.dirBox.innerHTML = text;
  }

  makeSection(section, t) {
    let startTime = (t == null) ? section.when : t;

    Tone.Transport.scheduleOnce((time) => {
      console.log(section);
      if ("instructions" in section) {
        this.dirBox.innerHTML = section.instructions;
      }
      this.notifyListeners(section);
      this.sectionIndex++;
    }, startTime);
  }

  stopPiece() {
    Tone.Transport.cancel(0);
    Tone.Transport.stop(Tone.now());
    Tone.Transport.position = "0:0:00";
    Tone.getDestination().volume.rampTo(-Infinity, 5);
    this.sectionIndex = 0;
    
    this.inProgress = false;
    // this.socket.pieceTime = Tone.Transport.position;
  }

  startPiece() {
    Tone.getDestination().volume.rampTo(0, 1);
    Tone.Transport.start(Tone.now());
    this.sectionIndex = 0;
    this.inProgress = true;

    for (const section of this.state) {
      this.makeSection(section);
    }
  }

  joinOngoing(state) {
    if (state.ongoing) {
      console.log(state);
      this.inProgress = true;
      this.sectionIndex = state.section - 1;
      Tone.Transport.position = state.position;

      for (let i = 0; i < this.state.length; i++) {
        if (i > this.sectionIndex) {
          this.makeSection(this.state[i]);
        } else if (i == this.sectionIndex) {
          this.makeSection(this.state[i], Tone.now());
        }
      }

      Tone.Transport.start(0.1, state.position);
    } else {
      console.log("piece not started yet");
    }
  }

  buildState() {
    return [
      { //small talk
        when: 0.1,
        duration: 60,
        zoom: { style: "normal" },
        textOffset: 40,  
        textRotation: -32.0,
        repeater: { frequency: "3m" },
        textDeviance: 2,
        text: { offset: 40, rotation: -32.0, deviance: 1 },
        blip: { max: 3, prob: 7, when: 0.1, duration: 60, frequency: "1n" },
        // bwomm: true,
        instructions: `
          Take turns speaking, using short-form small talk. Record every time you speak.
          Try to talk infrequently, leaving space for other people.
        `
      },
      { //speak1
        when: 70.1,
        bigText: "SO WHEN CAN\nI MEET YOU?",     
        zoomBlocks: "none",
        bwomm: true,
      },
      { // busy sched
        when: 74.1,
        duration: 60,
        zoom: { style: "shifty", deviance: 1 },
        repeater: { frequency: "3m" },
        useBlip: true,
        text: { offset: 40, rotation: -32.0, lossyThresh: 9, deviance: 2 },
        blip: { max: 5, prob: 6, when: 65.1, duration: 60, frequency: "1n" },
        instructions: `
          Discuss your actual schedule in short bursts, like 'I work 9 to 5' or
          'I'm busy on Thursdays.' Record every time you speak. Leave space for
          people, but not as much.
        `
      },
      { // talk 2
        when: 144.1,
        bigText: "WHY DO YOU\nALWAYS SAY\nYOU'RE BUSY?",     
        zoomBlocks: "none",
        bwomm: true,
      },
      { // start of excuses
        when: 148.1,
        duration: 60,
        zoom: { style: "shifty", deviance: 2 },
        text: { offset: 60, rotation: -28.0, lossyThresh: 7, deviance: 4, max: 6 },
        tinyBlocks: true,
        repeater: { frequency: "3m" },
        blip: { max: 5, prob: 6, when: 65.1, duration: 60, frequency: "1n" },
        instructions: `
          Start making excuses, but only say the opening clause. Things like 'funny
          you should mention,' 'well, you see', 'the thing is,' 'I wish I could, but,'
          etc. Speak more melodically – highlight the pitch of what you're saying,
          and follow a melodic contour.
        `
      },
      { // talk 3
        when: 208.1,
        bigText: "THAT'S NOT\nWHAT I MEANT",     
        zoomBlocks: "none",
        bwomm: true,
      },
      { // full excuses
        when: 212.1,
        duration: 60,
        zoom: { style: "shifty", deviance: 4 },
        tinyBlocks: true,
        repeater: { frequency: "1m" },
        // blip: { max: 5, prob: 6, when: 65.1, duration: 60, frequency: "1n" },
        text: { offset: 60, rotation: -22.0, lossyThresh: 4, deviance: 6, max: 7 },

        instructions: `
          Make your excuses in full. Use long sentences, but only
          record part of what you're saying. Speak constantly and
          melodically.
        `
      },
      { // talk 4
        when: 282.1,
        bigText: "WHY DO\nYOU KEEP\nAPOLOGIZING",     
        zoomBlocks: "none",
        bwomm: true,
      },
      { // lies and insults
        when: 286.1,
        duration: 60,
        zoom: { style: "shifty", deviance: 8 },
        tinyBlocks: true,

        text: { offset: 80, rotation: -16.0, lossyThresh: 3, deviance: 8, max: 8 },

        repeater: { frequency: "1m" },
        // blip: { max: 5, prob: 6, when: 65.1, duration: 60, frequency: "1n" },
        // text: { sizeMult: 2, spiky: 2 },
        instructions: `
          Make more drastic excuses. These can range from outright lies, to 
          uncomfortable things about the "speaker," or something very
          personal. Each sentence should be on one pitch. Record only
          part of what you're saying.
        `
      },
      { // talk 4
        when: 356.1,
        bigText: "DO YOU NOT\nLIKE ME OR\nSOMETHING",     
        zoomBlocks: "none",
        bwomm: true,
      },
      { // lies and insults sampler
        when: 360.1,
        duration: 60,
        zoom: { style: "shifty", deviance: 10 },
        tinyBlocks: true,
        repeater: { frequency: "3m" },
        blip: { max: 5, prob: 6, when: 65.1, duration: 60, frequency: "1n" },

        text: { offset: 60, rotation: -26.0, lossyThresh: 2, deviance: 10, max: 6 },

        instructions: `
          Take a few words from your drastic excuses and repeat them,
          giving yourself 2" or so between repeats. Record every
          time, and try to stick to one pitch. Don't match anyone
          else's pitch.
        `
      },
      { // talk 4
        when: 364.1,
        bigText: "I DON'T NEED\nTO DEAL\nWITH THIS",     
        zoomBlocks: "none",
        bwomm: true,
      },
      { // small talk redux
        when: 368.1,
        duration: 60,
        zoom: { style: "normal" },
        tinyBlocks: true,
        repeater: { frequency: "3m" },

        text: { offset: 80, rotation: -40.0, lossyThresh: 2, deviance: 2, fontSize: 100, max: 5 },

        blip: { max: 5, prob: 6, when: 65.1, duration: 60, frequency: "1n" },
        instructions: `
          Small talk again, same as the beginning. Occasionally 
          intersperse your small talk phrases with incongruous 
          mentions of your drastic excuse phrases.
        `
      },
    ];
  }
}

export default PieceManager;
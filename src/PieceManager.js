import * as Tone from "tone";

class PieceManager {
  constructor() {
    this.flags = {
      useRepeater: false,
      noiseWhileSpeaking: false,
      noiseAsBGBursts: false,
    };

    this.sectionIndex = 0;
    this.state = [
      { //small talk
        when: 0.1,
        duration: 10,
        zoom: { style: "normal" },
        blip: { max: 3, prob: 7, when: 0.1, duration: 60, frequency: "1n" },
        instructions: `
          Take turns speaking, using short-form small talk. Record every time you speak.
          Try to talk infrequently, leaving space for other people.
        `
      },
      { //speak1
        when: 60.1,
        bigText: "SO WHEN DO\nYOU HAVE TIME TO MEET?",     
        zoomBlocks: "none",
      },
      { // busy sched
        when: 64.1,
        duration: 60,
        zoom: { style: "shifty", deviance: 15 },
        // tinyBlocks: true,
        repeater: { frequency: "3m" },
        useBlip: true,
        blip: { max: 5, prob: 6, when: 65.1, duration: 60, frequency: "1n" },
        instructions: `
          Discuss your actual schedule in short bursts, like 'I work 9 to 5' or
          'I'm busy on Thursdays.' Record every time you speak. Leave space for
          people, but not as much.
        `
      },
      { // talk 2
        when: 124.1,
        bigText: "WHY ARE YOU\nALWAYS SO BUSY?",     
        zoomBlocks: "none",
      },
      { // start of excuses
        when: 128.1,
        duration: 60,
        zoom: { style: "shifty", deviance: 30 },
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
        when: 188.1,
        bigText: "THAT'S NOT\nWHAT I MEANT",     
        zoomBlocks: "none",
      },
      { // full excuses
        when: 192.1,
        duration: 60,
        zoom: { style: "shifty", deviance: 40 },
        tinyBlocks: true,
        repeater: { frequency: "1m" },
        // blip: { max: 5, prob: 6, when: 65.1, duration: 60, frequency: "1n" },
        text: { sizeMult: 2, spiky: 2 },
        instructions: `
          Make your excuses in full. Use long sentences, but only
          record part of what you're saying. Speak constantly and
          melodically.
        `
      },
      { // talk 4
        when: 252.1,
        bigText: "THAT'S NOT\nWHAT I MEANT",     
        zoomBlocks: "none",
      },
      { // lies and insults
        when: 256.1,
        duration: 60,
        zoom: { style: "shifty", deviance: 30 },
        tinyBlocks: true,
        repeater: { frequency: "1m" },
        // blip: { max: 5, prob: 6, when: 65.1, duration: 60, frequency: "1n" },
        text: { sizeMult: 2, spiky: 2 },
        instructions: `
          Make more drastic excuses. These can range from outright lies, to 
          uncomfortable things about the "speaker," or something very
          personal. Each sentence should be on one pitch. Record only
          part of what you're saying.
        `
      },
      { // talk 4
        when: 306.1,
        bigText: "THAT'S NOT\nWHAT I MEANT",     
        zoomBlocks: "none",
      },
      { // lies and insults sampler
        when: 310.1,
        duration: 60,
        zoom: { style: "shifty", deviance: 15 },
        tinyBlocks: true,
        repeater: { frequency: "3m" },
        blip: { max: 5, prob: 6, when: 65.1, duration: 60, frequency: "1n" },
        text: { sizeMult: 2, spiky: 2 },
        instructions: `
          Take a few words from your drastic excuses and repeat them,
          giving yourself 2" or so between repeats. Record every
          time, and try to stick to one pitch. Don't match anyone
          else's pitch.
        `
      },
      { // talk 4
        when: 306.1,
        bigText: "THAT'S NOT\nWHAT I MEANT",     
        zoomBlocks: "none",
      },
      { // small talk redux
        when: 310.1,
        duration: 60,
        zoom: { style: "normal" },
        tinyBlocks: true,
        repeater: { frequency: "3m" },
        blip: { max: 5, prob: 6, when: 65.1, duration: 60, frequency: "1n" },
        text: { sizeMult: 2, spiky: 2 },
        instructions: `
          Small talk again, same as the beginning. Occasionally 
          intersperse your small talk phrases with incongruous 
          mentions of your drastic excuse phrases.
        `
      },
    ];

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

  makeSection(section) {
    Tone.Transport.scheduleOnce((time) => {
      console.log(section);
      if ("instructions" in section) {
        this.dirBox.innerHTML = section.instructions;
      }
      this.notifyListeners(section);
      this.sectionIndex++;
    }, section.when);
  }

  stopPiece() {
    Tone.Transport.cancel(0);
    this.sectionIndex = 0;
  }

  startPiece(blipSynth) {
    Tone.Transport.start();
    this.sectionIndex = 0;

    for (const section of this.state) {
      this.makeSection(section);
    }

    // this.makeSection((time) => {
    //   blipSynth.blipBurst(time, 3, 7);
    // }, "1n", 0.1, 60);

    // this.makeSection((time) => {
    //   blipSynth.blipBurst(time, 5, 6);
    // }, "2n", )
    
  //     this.pieceText("Speak only one word at a time, and record any time you speak.");
  //   }, "1n", 0.1, 60);

    // this.makeSection((time) => {
    //   blipSynth.blipBurst(time, 5, 6);
    // }, "1n", 60.1, 60);
  // burstHappening = false;

  //   Tone.Transport.scheduleRepeat((time) => {
  //     // console.log("first section");
  //     // pieceState.useRepeater = true;
  //     blipSynth.blipBurst(time, 3, 7);
  //     this.pieceText("Speak only one word at a time, and record any time you speak.");
  //   }, "1n", 0.1, 60);

  //   Tone.Transport.scheduleRepeat((time) => {
  //     console.log("in section two");
  //     this.flags.useRepeater = true;
  //     blipSynth.blipBurst(time, 5, 6);
  //     this.pieceText("Speak three words at a time. When you record, you should hear yourself back in a different synth.");
  //   }, "2n", 60.1, 60);

  //   Tone.Transport.scheduleRepeat((time) => {
  //     console.log("section 3");
  //     blipSynth.blipBurst(time, 6, 5);
  //     this.flags.noiseWhileSpeaking = true;
  //     this.pieceText("Talk frequently in a normal voice. Record yourself intermittently, for ~3 words at a time.");
  //   }, "2n", 120.1, 60);
  // }
  }
}

export default PieceManager;
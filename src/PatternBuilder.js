class PatternBuilder {
  constructor() {
    this.pattern = [];
    this.curve = [];
    this.recording = false;
  }

  startCollecting() {
    if (!this.recording) {
      this.recording = true;
      this.pattern = [];
      this.curve = [];
    }
  }

  stopCollecting() {
    this.recording = false;
    console.log(this.pattern);
    return this.formatLocalPattern();
  }

  addItem(item) {
    if (this.recording) {
      // console.log(item);
      this.pattern.push(item);
      // console.log(this.pattern);
    }
  }

  formatLocalPattern() {
    if (this.pattern.length > 0) {
      const timeOff = this.pattern[0].time;
      let retval = [];
      for (let note of this.pattern) {
        if (note.event == "transition" || note.event == "start" && note.pitch !== null) {
          retval.push([note.time - timeOff, note.pitch]);
          this.curve.push(note.pitch);
        }
      }

      return { pitches: this.curve, duration: retval[retval.length-1][0] };
    } else {
      return { error: "no pitch sequence" };
    }
  }
}

export default PatternBuilder;
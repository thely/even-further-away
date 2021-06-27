import UserSynth from './UserSynth.js';
import { linspace } from "./utils.js";
let Tone;

class UserList {
  constructor(options, toneRef) {
    Tone = toneRef;
    this.users = {};
    this.selfID = "";
    this.keys = [];
    this.statusBar = document.querySelector(".user-count");

    if (options != null && "viewer" in options && options.viewer) {
      this.viewer = true;
    }
  }

  getSynth(id) {
    return this.users[id].synth;
  }

  getUser(id) {
    return this.users[id];
  }

  newUser(id) {
    this.keys.push(id);
    this.users[id] = {};
    this.users[id].synth = new UserSynth(id, Tone);
    return this.users[id];
  }

  resetUserList(ids) {
    this.users = {};

    if ("self" in ids) {
      this.selfID = ids.self;
    }

    for (let id of ids.users) {
      this.newUser(id);
    }
  }
  
  get self() {
    return this.users[this.selfID];
  }

  removeUser(id) {
    if (!id in this.users) {
      return;
    }

    this.keys = this.keys.filter(f => f !== id);
    this.users[id].synth.destroy();
    delete this.users[id];
  }

  removeAllUsers() {
    for (const key of this.keys) {
      this.removeUser(key);
    }

    this.keys = [];
    this.selfID = "";
  }

  updateUserCount() {
    if (!this.viewer) {
      this.statusBar.innerHTML = "Users on server: " + this.keys.length;
    }
    
    this.readjustPan(-1, 1);
  }

  readjustPan(min, max) {
    let index = 0;
    // let length = Object.keys(users).length;
    let panVals = linspace(min, max, this.keys.length);
    let panVals2 = linspace(min + 0.1, max - 0.1, this.keys.length);
    for (let id of this.keys) {
      this.users[id].synth.rePan(panVals[index]);
      index++;
    }
  }

  handleStateChange(state) {
    // if ("repeater" in state) {
      for (const key of this.keys) {
        this.users[key].synth.handleStateChange(state);
      }
    // }
  }
}

export default UserList;
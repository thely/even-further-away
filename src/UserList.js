import UserSynth from './UserSynth.js';
import { linspace } from "./utils.js";

class UserList {
  constructor() {
    this.users = {};
    this.selfID = "";
    this.keys = [];
    this.statusBar = document.querySelector(".user-count");
  }

  getSynth(id) {
    // console.log(id);
    // console.log(this.users);
    return this.users[id].synth;
  }

  getUser(id) {
    return this.users[id];
  }

  newUser(id) {
    this.keys.push(id);
    this.users[id] = {};
    this.users[id].synth = new UserSynth(id);
    return this.users[id];
  }

  resetUserList(ids) {
    this.users = {};
    this.selfID = ids.self;

    for (let id of ids.users) {
      this.newUser(id);
    }
  }
  
  get self() {
    return this.users[this.selfID];
  }

  // socket.on("selfConnect", (ids) => {
  //   users = {};
  //   myID = ids.self;
  
  //   self = newUser(myID);
  //   for (let id of ids.others) {
  //     newUser(id);
  //   }
  
  //   micInput = new MicInput(myID);
  //   blipSynth = new BlipSynth();
  //   pieceManager = new PieceManager();
  //   meterBlock = new MeterBlock();
  
  //   updateUserCount(users);
  // });
  

//   socket.on("userConnect", (id) => {
//   newUser(id);
//   updateUserCount(users);
// });

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
// socket.on("userDisconnect", (id) => {
//   if (!id in users || !"sound" in users[id]) {
//     return;
//   }

//   users[id].destroy();

//   delete users[id];
//   console.log(users);
//   updateUserCount(users);
// });

  updateUserCount() {
    // const keys = Object.keys(users);
    this.statusBar.innerHTML = "Users on server: " + this.keys.length;
    // meterBlock.updateMeterCount(keys);
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
}

export default UserList;
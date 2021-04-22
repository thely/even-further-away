// let meterParent = document.getElementById("user-meters");
// let meterCache = {};

class MeterBlock {
  constructor() {
    this.parent = document.getElementById("user-meters");
    this.cache = {};
  }

  updateMeterCount(keys, self) {
    console.log("updatemetercount");
    let elems = "";
    for (let i = 0; i < keys.length; i++) {
      let isSelf = "";
      if (keys[i] == self) isSelf = "isSelf";
      elems += `
        <li id="meter-${keys[i]}" class="single-meter ${isSelf}" data-user="${keys[i]}">
          <span class="inner inner-left"></span>
          <span class="inner inner-right"></span>
          <input type="range" class="slider" name="channel" min="-30" max="5" step="0.1" value="0.0" >
        </li>
      `;
    }
  
    this.parent.innerHTML = elems;
    this.cache = {};
    for (const meter of this.parent.children) {
      this.meterListener(meter);
    }
  }

  meterListener(meter) {
    meter.addEventListener("change", (e) => {
      const event = new CustomEvent("volumeChange", {
        detail: {
          id: meter.dataset.user,
          multiplier: e.target.value
        }
      });

      this.parent.dispatchEvent(event);
    });

    this.cache[meter.dataset.user] = [meter.children[0], meter.children[1]];
  }

  updateSingleMeter(vol, id) {
    let val = [];
    val[0] = rangeScale(vol[0], -80.0, 0.0, 0.0, 1.0) * 100;
    val[1] = rangeScale(vol[1], -80.0, 0.0, 0.0, 1.0) * 100;
    this.cache[id][0].style.width = val[0] + "%";
    this.cache[id][1].style.width = val[1] + "%";
  }
}


function rangeScale(input, oldmin, oldmax, newmin, newmax) {
  let percent = (input - oldmin) / (oldmax - oldmin);
  let output = percent * (newmax - newmin) + newmin;
  return output;
}


export default MeterBlock;
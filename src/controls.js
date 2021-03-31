let meterParent = document.getElementById("user-meters");
let meterCache = {};

function updateMeterCount(keys) {
  console.log("updatemetercount");
  let elems = "";
  for (let i = 0; i < keys.length; i++) {
    elems += `
      <li id="meter-${keys[i]}" class="single-meter" data-user="${keys[i]}">
        <span class="inner inner-left"></span>
        <span class="inner inner-right"></span>
        <input type="range" class="slider" name="channel" min="-30" max="5" step="0.1" value="0.0" >
      </li>
    `;
  }

  meterParent.innerHTML = elems;
  meterCache = {};
  for (const meter of meterParent.children) {
    meter.addEventListener("change", (e) => {
      const event = new CustomEvent("volumeChange", {
        detail: {
          id: meter.dataset.user,
          multiplier: e.target.value
        }
      });

      meterParent.dispatchEvent(event);
    });
    meterCache[meter.dataset.user] = [meter.children[0], meter.children[1]];
  }

  console.log(meterCache);
}

function updateSingleMeter(vol, id) {
  let val = [];
  val[0] = rangeScale(vol[0], -80.0, 0.0, 0.0, 1.0) * 100;
  val[1] = rangeScale(vol[1], -80.0, 0.0, 0.0, 1.0) * 100;
  meterCache[id][0].style.width = val[0] + "%";
  meterCache[id][1].style.width = val[1] + "%";
}

function rangeScale(input, oldmin, oldmax, newmin, newmax) {
  let percent = (input - oldmin) / (oldmax - oldmin);
  let output = percent * (newmax - newmin) + newmin;
  return output;
}


export { updateMeterCount, updateSingleMeter };


// document.querySelector("#master").addEventListener("change", (e) => {
//   Tone.getDestination().volume.rampTo(e.target.value, 0.1, Tone.context.currentTime);
// });

// document.querySelector("#mute").addEventListener("change", (e) => {
//   SELF_MUTE = e.target.checked;
// });
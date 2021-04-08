function randomInRange(max, min) {
  if (min == null) min = 0;
  return Math.random() * max + min;
}

function linspace(startValue, stopValue, cardinality) {
  if (cardinality == 1) {
    return [0];
  }

  var arr = [];
  var step = (stopValue - startValue) / (cardinality - 1);
  for (var i = 0; i < cardinality; i++) {
    arr.push(startValue + (step * i));
  }
  return arr;
}

function addRecordingAsElement(blob) {
  let audio = document.createElement('audio');
  audio.setAttribute('controls', '');
  document.querySelector(".clipsZone").appendChild(audio);
  audio.controls = true;
  audio.src = URL.createObjectURL(blob);
}

export { randomInRange, linspace, addRecordingAsElement };
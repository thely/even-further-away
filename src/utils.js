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

function shuffle(arr) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

export { randomInRange, linspace, addRecordingAsElement, shuffle };
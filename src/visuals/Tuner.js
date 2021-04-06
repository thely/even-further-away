
const lowerLimit = 220;
const upperLimit = 440;
function rerangeNote(note) {
  if (note >= lowerLimit && note < upperLimit) {
    return note;
  } else if (note < lowerLimit) {
    return rerangeNote(note * 2);
  } else if (note >= upperLimit) {
    return rerangeNote(note / 2);
  }
}

let currentNote = rerangeNote(800.0);
let targetNote = rerangeNote(440.0);
// console.log(currentNote, targetNote);
function drawTuner(p) {
  // const diff = targetNote / currentNote * 100;
  const targetX = p.map(targetNote, upperLimit, lowerLimit, 50, p.height - 50);
  const currentX = p.map(currentNote, upperLimit, lowerLimit, 50, p.height - 50);
  // console.log(diff);
  // console.log(p.width / 4 - 35); // 165
  p.rect(p.width / 4 - 35, targetX / 2 - 2.5, 70, 5);
  p.rect(p.width / 4 - 35, currentX / 2 - 2.5, 70, 5);
}

// function updateCanvasTunerPitch(pitch) {
//   // console.log(pitch);
//   currentNote = rerangeNote(pitch);
// }

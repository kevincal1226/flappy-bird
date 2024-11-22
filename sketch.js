// Daniel Shiffman
// http://codingtra.in
// http://patreon.com/codingtrain
// Code for: https://youtu.be/cXgA1d_E-jY

// P5 exported functions (eslint flags)
/* exported preload, setup, draw, keyPressed */

// Exported sprites (eslint flags)
/* exported birdSprite, pipeBodySprite, pipePeakSprite */

var parallax = 0.8;
var score = 0;
var maxScore = 0;
var gameoverFrame = 0;
var isOver = false;
let playerWon = false;

let numBirds = 0;
let counter = 0;

var touched = false;
var prevTouched = touched;

const POP_TOTAL = 500;

// UI elements
let speedSlider;
let speedSpan;
let highScoreSpan;
let allTimeHighScoreSpan;

// High score
let highScore = 0;

let birds = [];
let savedBirds = [];
let pipes = [];

// Challenge mode
let birdbrain = null;
let aibird = null;
let playerbird = null;

let challengemode = false;

let c1, c2;
let scroll = 0;

function preload() {
  brainJSON = loadJSON("bird.json");
}

function setup() {
  let canvas = createCanvas(600, 500);
  canvas.parent("canvascontainer");

  // Check if challenge mode
  challengeCheckbox = select("#challenge-checkbox");
  speedSlider = select("#speedSlider");
  speedSpan = select("#speed");
  highScoreSpan = select("#hs");
  allTimeHighScoreSpan = select("#ahs");
  // Access the interface elements

  birdbrain = NeuralNetwork.deserialize(brainJSON);

  c1 = color(52, 197, 162);
  c2 = color(137, 106, 228);

  for (let i = 0; i < POP_TOTAL; ++i) {
    birds[i] = new Bird();
  }

  reset();
}

// Callback function for when checkbox/button pressed
function challenge() {
  console.log("CHALLENGE TOGGLED");

  if (challengeCheckbox.checked()) {
    savedBirds = [];
    birds = [];
  } else {
    for (let i = 0; i < POP_TOTAL; ++i) {
      birds[i] = new Bird();
    }
  }
  challengemode = challengeCheckbox.checked();
  reset();
}

function draw() {
  if (challengeCheckbox.checked()) {
    startChallenge(1);
  } else {
    let cycles = speedSlider.value();
    speedSpan.html(cycles);
    startChallenge(cycles);

    let tempHighScore = 0;

    // Which is the best bird?
    let tempBestBird = null;
    for (let i = 0; i < birds.length; i++) {
      let s = birds[i].score;
      if (s > tempHighScore) {
        tempHighScore = s;
        tempBestBird = birds[i];
      }
    }

    // Is it the all time high scorer?
    if (tempHighScore > highScore) {
      highScore = tempHighScore;
      bestBird = tempBestBird;
    }
    // Update DOM Elements
    highScoreSpan.html(tempHighScore);
    allTimeHighScoreSpan.html(highScore);

    numBirds = birds.length;
  }

  drawCanvas();

  scroll += 2;
}

function drawCanvas() {
  drawBackground();
  drawSinusoidalPattern();

  for (let bird of birds) {
    bird.show();
  }
  if (challengeCheckbox.checked()) {
    aibird.show();
    playerbird.show();
  }
  for (let pipe of pipes) {
    pipe.show();
  }

  drawGameOver();
  showScores();
}

function startChallenge(cycles) {
  if (challengemode) {
    select("#traincontainer").hide();
    aibird.show();
    playerbird.show();
  } else {
    select("#traincontainer").show();
  }

  for (let n = 0; n < cycles; n++) {
    if (counter % 50 == 0) {
      pipes.push(new Pipe());
    }
    counter++;

    for (var i = pipes.length - 1; i >= 0; i--) {
      pipes[i].update();

      if (challengemode) {
        if (pipes[i].hits(playerbird)) {
          gameover(false);
        } else if (pipes[i].hits(aibird)) {
          gameover(true);
        }
      } else {
        for (let j = birds.length - 1; j >= 0; j--) {
          if (pipes[i].hits(birds[j])) {
            savedBirds.push(birds.splice(j, 1)[0]);
          }
        }
      }

      if (pipes[i].offscreen()) {
        pipes.splice(i, 1);
        score++;
        if (score > maxScore) {
          maxScore = score;
        }
      }
    }

    if (challengemode) {
      if (playerbird.offScreen()) {
        gameover(false);
      } else if (aibird.offScreen()) {
        gameover(true);
      }
      aibird.think(pipes);
      aibird.update();
      playerbird.update();
    } else {
      for (let i = birds.length - 1; i >= 0; i--) {
        if (birds[i].offScreen()) {
          savedBirds.push(birds.splice(i, 1)[0]);
        }
      }
      for (let bird of birds) {
        bird.think(pipes);
        bird.update();
      }
      if (birds.length == 0) {
        counter = 0;
        nextGeneration();
        pipes = [];
      }
    }
  }
}

function showScores() {
  if (challengemode) {
    textSize(32);
    text("score: " + score, 60, 32);
    text("record: " + maxScore, 70, 64);
  }
}

function drawGameOver() {
  textSize(64);
  textAlign(CENTER, CENTER);
  fill(255);
  stroke(0);
  strokeWeight(5);

  if (isOver && playerWon) {
    console.log("PLAYER WON");
    text("YOU WIN!!!", width / 2, height / 2);
  } else if (isOver) {
    console.log("PLAYER LOST");
    text("YOU LOSE :(", width / 2, height / 2);
  }

  noStroke();
}

function gameover(playerWins) {
  playerWon = playerWins;
  maxScore = max(score, maxScore);
  isOver = true;
  noLoop();
}

function reset() {
  isOver = false;
  score = 0;
  bgX = 0;
  counter = 0;
  pipes = [];
  if (challengeCheckbox.checked()) {
    pipes = [];
    playerbird = new Bird(null, true);
    aibird = new Bird(birdbrain);
  }

  gameoverFrame = frameCount - 1;
  loop();
}

function keyPressed() {
  if (key === " " && challengeCheckbox.checked()) {
    playerbird.up();
    if (isOver) reset(); //you can just call reset() in Machinelearning if you die, because you cant simulate keyPress with code.
  }
  if (key === "S" && !challengeCheckbox.checked()) {
    let bird = birds[0];
    console.log("SAVED BIRD WEIGHTS");
    saveJSON(bird.brain, "bird.json");
  }
}

function touchStarted() {
  if (isOver) reset();
}

function drawBackground() {
  for (let y = 0; y < height; y++) {
    const n = map(y, 0, height, 0, 1);
    const newc = lerpColor(c1, c2, n);
    stroke(newc);
    line(0, y, width, y);
  }
}

function drawSinusoidalPattern() {
  for (let x = 0; x < width; x++) {
    const y = map(sin(radians(x + scroll)), -1, 1, 200, 600);
    noStroke();
    fill(255, 255, 255);
    ellipse(x, y, 15, 15);
  }
}

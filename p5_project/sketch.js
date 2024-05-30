let whiteDots = []; // empty array to save the white dots in the background (group)
let coloredCircles = []; //empty array to save the attributes about the circle (group)
let particles = [];
let song;
let analyzer;
let volume = 1.0;
let pan = 0.0;
let isPlaying = false;

// Create a class for the white dots
class WhiteDot {
  constructor(x, y, size, speed) {
    this.position = createVector(x, y);
    this.size = size;
    this.speed = speed;
    this.trail = [];
  }

  move() {
    let mousePos = createVector(mouseX, mouseY);
    let direction = p5.Vector.sub(mousePos, this.position).normalize().mult(this.speed);
    let randomOffset = p5.Vector.random2D().mult(0.5);
    this.position.add(direction).add(randomOffset);

    for (let otherDot of whiteDots) {
      if (otherDot !== this) {
        let distance = p5.Vector.dist(this.position, otherDot.position);
        let minDistance = this.size + otherDot.size + 10;
        if (distance < minDistance) {
          let pushDirection = p5.Vector.sub(this.position, otherDot.position).normalize().mult(0.1);
          this.position.add(pushDirection);
        }
      }
    }

    this.position.x = constrain(this.position.x, 0, width);
    this.position.y = constrain(this.position.y, 0, height);

    this.trail.push(this.position.copy());
    if (this.trail.length > 50) {
      this.trail.shift();
    }
  }

  draw(dotSize) {
    noStroke();
    fill(255);
    ellipse(this.position.x, this.position.y, this.size * dotSize);

    beginShape();
    for (let point of this.trail) {
      vertex(point.x, point.y);
    }
    endShape();
  }
}

// Create a class for all the circles (group)
class ColoredCircle {
  constructor(x, y, radius, colors) { //this class inlcude the x and y position of the circle, its radius and color
    this.position = createVector(x, y); //createVector() is a function to create a two-dimensional vector
    this.radius = radius;
    this.colors = colors;
    this.animationState = 0;
  }

  draw(scale) {
    noStroke();
    //fill the first color in the color array, which is the color for the large circle
    fill(this.colors[0]);
    ellipse(this.position.x, this.position.y, this.radius * 2 * scale * this.getAnimationScale()); //the radius for the large circle is 120, in the drawCircles() function
    
    //fill the second color in the color array, which is the color for the meidum circle
    fill(this.colors[1]);
    ellipse(this.position.x, this.position.y, 150 * scale * this.getAnimationScale()); //the radius for the medium circle is 150
    
    //fill the third color in the color array, which is the color for the small circle
    fill(this.colors[2]);
    ellipse(this.position.x, this.position.y, 80 * scale * this.getAnimationScale()); //the radius for the small circle is 80
  }

  getAnimationScale() {
    let animationScale = 1;
    if (this.animationState === 1) {
      animationScale = map(sin(frameCount * 0.05), 0, 1, 1, 1.5);
    } else if (this.animationState === 2) {
      animationScale = map(sin(frameCount * 0.05), 0, 1, 1.5, 1);
    }
    return animationScale;
  }
}

class Particle {
  constructor(x, y, color) {
    this.position = createVector(x, y);
    this.velocity = p5.Vector.random2D().mult(random(2, 6));
    this.color = color;
    this.lifespan = 255;
  }

  update() {
    this.position.add(this.velocity);
    this.lifespan -= 2;
  }

  draw() {
    stroke(this.color, this.lifespan);
    strokeWeight(2);
    point(this.position.x, this.position.y);
  }

  isDead() {
    return this.lifespan < 0;
  }
}

function preload() {
  song = loadSound('assets/baroque-brilliance-instrumental-music-211822.mp3');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  drawCircles();

  analyzer = new p5.Amplitude();
  analyzer.setInput(song);

  for (let i = 0; i < 250; i++) {
    let x = random(width);
    let y = random(height);
    let size = random(5, 15);
    let speed = random(2, 4);
    whiteDots.push(new WhiteDot(x, y, size, speed));
  }

  let button = createButton('Play/Pause');
  button.position((width - button.width) / 2, height - button.height - 2);
  button.mousePressed(play_pause);
}

function draw() {
  drawBackground();
  if (isPlaying) {
    let level = analyzer.getLevel();
    let scale = map(level, 0, 1, 0.5, 2);

    for (let circle of coloredCircles) {
      circle.draw(scale);
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      let particle = particles[i];
      particle.update();
      particle.draw();
      if (particle.isDead()) {
        particles.splice(i, 1);
      }
    }

    if (level > 0.8) {
      for (let circle of coloredCircles) {
        circle.animationState = 1;
      }
    } else if (level < 0.2) {
      for (let circle of coloredCircles) {
        circle.animationState = 2;
      }
    } else {
      for (let circle of coloredCircles) {
        circle.animationState = 0;
      }
    }

    if (level > 0.5 && particles.length < 1000) {
      for (let dot of whiteDots) {
        let color = color(255, 255, 255, random(50, 200));
        particles.push(new Particle(dot.position.x, dot.position.y, color));
      }
    }
  }
}

function drawCircles() {
  coloredCircles = [];
  let largeCircleColors = [color(217, 233, 237), color(174, 195, 112), color(253, 185, 93), color(255, 200, 198), color(246, 232, 141), color(235, 203, 246), color(67, 200, 176)];
  let mediumCircleColors = [color(14, 13, 116), color(9, 102, 23), color(244, 68, 46), color(229, 83, 192), color(239, 126, 45), color(253, 185, 93), color(250, 251, 253)];
  let smallCircleColors = [color(244, 147, 96), color(228, 93, 86), color(0, 0, 0), color(174, 195, 112), color(38, 75, 207), color(155, 100, 209), color(63, 73, 97)];
  let circlePositions = [createVector(width * 0.4, height * 0.1), createVector(width * 0.1, height * 0.35), createVector(width * 0.85, height * 0.25), createVector(width * 0.5, height * 0.5), createVector(width * 0.15, height * 0.75), createVector(width * 0.55, height * 0.9), createVector(width * 0.9, height * 0.73)];

  for (let i = 0; i < circlePositions.length; i++) {
    let colorsSet = [largeCircleColors[i], mediumCircleColors[i], smallCircleColors[i]];
    coloredCircles.push(new ColoredCircle(circlePositions[i].x, circlePositions[i].y, 120, colorsSet));
  }
}

function drawBackground() {
  background(4, 80, 111);
  let level = analyzer.getLevel();
  let dotSize = map(level, 0, 1, 0.5, 2);
  for (let dot of whiteDots) {
    dot.move();
    dot.draw(dotSize);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  whiteDots = [];
  drawCircles();
  for (let i = 0; i < 250; i++) {
    let x = random(width);
    let y = random(height);
    let size = random(5, 15);
    let speed = random(2, 4);
    whiteDots.push(new WhiteDot(x, y, size, speed));
  }
}

function play_pause() {
  if (isPlaying) {
    song.stop();
    isPlaying = false;
  } else {
    song.loop();
    isPlaying = true;
  }
}

function mouseMoved() {
  volume = map(mouseY, 0, height, 1, 0);
  song.setVolume(volume);
  pan = map(mouseX, 0, width, -1, 1);
  song.pan(pan);
}
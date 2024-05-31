let whiteDots = []; // empty array to save the white dots in the background (group)
let coloredCircles = []; //empty array to save the attributes of the circle (group)
let particles = []; // empty array to save the particle objects
let song; // hold the sound file
let analyzer; // analyze the amplitude
let volume = 1.0; // control volume
let pan = 0.0; // control panning
let isPlaying = false; 

// Create a class for the white dots
class WhiteDot {
  constructor(x, y, size, speed) {
    this.position = createVector(x, y);
    this.size = size;
    this.speed = speed;
    this.trail = []; // empty array to save the previous position of the dot
  }

  // update the position of white dots based on mouse position and prevent collisions
  move() {
    let mousePos = createVector(mouseX, mouseY);
    let direction = p5.Vector.sub(mousePos, this.position).normalize().mult(this.speed);
    let randomOffset = p5.Vector.random2D().mult(0.5); // randomess in dot's movement
    this.position.add(direction).add(randomOffset); //update dot's position

    for (let otherDot of whiteDots) {
      if (otherDot !== this) {
        let distance = p5.Vector.dist(this.position, otherDot.position);
        let minDistance = this.size + otherDot.size + 10;
        if (distance < minDistance) {
          let pushDirection = p5.Vector.sub(this.position, otherDot.position).normalize().mult(0.1);
          this.position.add(pushDirection); // avoid overlap
        }
      }
    }

    this.position.x = constrain(this.position.x, 0, width);
    this.position.y = constrain(this.position.y, 0, height);

    // if the trail length > 50, the oldest position is removed from the beginning of the array, creating the trail effect
    this.trail.push(this.position.copy());
    if (this.trail.length > 50) {
      this.trail.shift();
    }
  }

  // the draw function creates the white dot as a circle and draws a trail behind it using the positions saved in the trail array.
  draw(dotSize) {
    noStroke();
    fill(255);
    ellipse(this.position.x, this.position.y, this.size * dotSize);

    beginShape();
    for (let point of this.trail) {
      vertex(point.x, point.y);
    } //goes through each point in the trail array (which contains the previous positions of the dot) and adds a vertex at each point's x and y coordinates using the vertex function.
    endShape(); // connect the last vertex to the first vertex to create trail effect
  }
}

// Create a class for all the circles (group)
class ColoredCircle {
  constructor(x, y, radius, colors) { //this class inlcude the x and y position of the circle, its radius and color
    this.position = createVector(x, y); //createVector() is a function to create a two-dimensional vector
    this.radius = radius;
    this.colors = colors;
    this.animationState = 0; // initialize the animation state of the circle
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

  // based on the "animationState", this method adjusts the size of the circles by using sin to create pulsating effect
  // goal is to create growing and shrinking effect of the circles
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

// turn white dots into meteor
class Particle {
  constructor(x, y, color) {
    this.position = createVector(x, y);
    this.velocity = p5.Vector.random2D().mult(random(2, 6));
    this.color = color;
    this.lifespan = 255;
  }

  update() {
    this.position.add(this.velocity);
    this.lifespan -= 2; // particle fading over time
  }

  draw() {
    stroke(this.color, this.lifespan);
    strokeWeight(2);
    point(this.position.x, this.position.y);
  }

  // check if the particle's lifespan has ended, less than 0 means it's dead and should be removed
  isDead() { 
    return this.lifespan < 0;
  }
}


// load the sound file
function preload() {
  song = loadSound('assets/baroque-brilliance-instrumental-music-211822.mp3');
}

function setup() {
  //let the width and height became the size of the canvas
  createCanvas(windowWidth, windowHeight);
  drawCircles();

  // amp analyzer
  analyzer = new p5.Amplitude(); //measure the volume of the sound
  analyzer.setInput(song);

  // create 250 white dots
  for (let i = 0; i < 250; i++) {
    let x = random(width);
    let y = random(height);
    let size = random(5, 15);
    let speed = random(2, 4);
    whiteDots.push(new WhiteDot(x, y, size, speed));
  }

  // play/pause button
  let button = createButton('Play/Pause');
  button.position((width - button.width) / 2, height - button.height - 2);
  button.mousePressed(play_pause);
}

function draw() {
  drawBackground();
  if (isPlaying) {
    let level = analyzer.getLevel();
    let scale = map(level, 0, 1, 0.5, 2);

    // draw coloured circles
    for (let circle of coloredCircles) {
      circle.draw(scale);
    }
    
    // circles' animation state
    if (level > 0.8) { // high amp level
      for (let circle of coloredCircles) {
        circle.animationState = 1;
      }
    } else if (level < 0.2) { // low amp level
      for (let circle of coloredCircles) {
        circle.animationState = 2;
      }
    } else { // medium amp level
      for (let circle of coloredCircles) {
        circle.animationState = 0;
      }
    }
  }
}

function drawCircles() {
  coloredCircles = [];
  let largeCircleColors = [color(217, 233, 237), color(174, 195, 112), color(253, 185, 93), color(255, 200, 198), color(246, 232, 141), color(235, 203, 246), color(67, 200, 176)]; //large circles colour
  let mediumCircleColors = [color(14, 13, 116), color(9, 102, 23), color(244, 68, 46), color(229, 83, 192), color(239, 126, 45), color(253, 185, 93), color(250, 251, 253)]; //medium circles colour
  let smallCircleColors = [color(244, 147, 96), color(228, 93, 86), color(0, 0, 0), color(174, 195, 112), color(38, 75, 207), color(155, 100, 209), color(63, 73, 97)]; //small circles colour
  let circlePositions = [createVector(width * 0.4, height * 0.1), createVector(width * 0.1, height * 0.35), createVector(width * 0.85, height * 0.25), createVector(width * 0.5, height * 0.5), createVector(width * 0.15, height * 0.75), createVector(width * 0.55, height * 0.9), createVector(width * 0.9, height * 0.73)]; // circles' x and y position

  //the for loop goes through each position in the circlePositions array
  for (let i = 0; i < circlePositions.length; i++) {
    //get the color at position i in the array,and combines them into a array called colorsSet
    let colorsSet = [largeCircleColors[i], mediumCircleColors[i], smallCircleColors[i]];
    //based on the position, radius and color, create a new ColoredCircle object and add it to the coloredCircles array
    //the radisu for the large circle is 120
    coloredCircles.push(new ColoredCircle(circlePositions[i].x, circlePositions[i].y, 120, colorsSet));
  }
}

function drawBackground() {
  background(4, 80, 111); //set background color
  let level = analyzer.getLevel();
  let dotSize = map(level, 0, 1, 0.5, 2);
  for (let dot of whiteDots) { //draw white dots on the background
    dot.move();
    dot.draw(dotSize);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight); //to make the canvas fit the screen
  whiteDots = []; // after resize the canvas, make the array empty
  drawCircles(); //redraw the drawCircles() function
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

// adjust the volume and panning based on mouse's position
function mouseMoved() {
  volume = map(mouseY, 0, height, 1, 0);
  song.setVolume(volume);
  pan = map(mouseX, 0, width, -1, 1);
  song.pan(pan);
}
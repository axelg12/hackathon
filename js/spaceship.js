var SCREEN_WIDTH = 750;
var SCREEN_HEIGHT = 400;
var SHOT_DELAY = 100;
var SHOT_SPEED = 500;
var AIRPLANE_SPEED = 100;

function timestamp() {
  return Date.now();
}

function createImage(src) {
  var img = new Image();
  img.src = '/images/' + src;
  return img;
}

function calculateMovement(state, pixelsPerSecond) {
  return (state.currentTick - state.prevTick) / 1000 * pixelsPerSecond;
}

function arrayRemove(array, item) {
  var i = array.indexOf(item);
  if (i > -1) array.splice(i, 1);
}

var IMAGES = {
  airplane: createImage('Air plane.png'),
  bigben: createImage('Big_ben.png'),
};

function Airplane() {
  this.x = 350;
  this.y = 350;
  this.width = 50;
  this.height = 50;
}

Airplane.prototype.draw = function(ctx) {
  ctx.translate(this.x, this.y);
  ctx.rotate(-Math.PI / 4);
  ctx.drawImage(IMAGES.airplane, 0, 0, this.width, this.height);
}

Airplane.prototype.moveLeft = function(state) {
  this.x -= calculateMovement(state, AIRPLANE_SPEED);
}

Airplane.prototype.moveRight = function(state) {
  this.x += calculateMovement(state, AIRPLANE_SPEED);
}

Airplane.prototype.shoot = function(state) {
  if (!this.lastShot || this.lastShot < timestamp() - SHOT_DELAY) {
    this.lastShot = timestamp();
    state.shots.push(new Shot(this.x + this.width / 2, this.y));
  }
}

function Shot(x, y) {
  this.x = x;
  this.y = y;
  this.height = 30;
  this.width = 274 / 960 * this.height;
}

Shot.prototype.update = function(state) {
  this.y -= calculateMovement(state, SHOT_SPEED);
  if (this.y <= -this.height) arrayRemove(state.shots, this);
}

Shot.prototype.draw = function(ctx) {
  ctx.translate(this.x, this.y);
  ctx.drawImage(IMAGES.bigben, 0, 0, this.width, this.height);
}

function init() {
  var state = {
    shots: [],
    airplane: new Airplane(),
    keysDown: {},
    prevTick: timestamp(),
    currentTick: null,
  };

  function getThings() {
    return state.shots.concat(state.airplane);
  }

  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');

  function update() {
    if (state.keysDown[37]) state.airplane.moveLeft(state);
    if (state.keysDown[39]) state.airplane.moveRight(state);
    if (state.keysDown[32]) state.airplane.shoot(state);

    getThings().forEach(function(thing) {
      if (thing.update) thing.update(state);
    });
  }

  function draw() {
    ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    getThings().forEach(function(thing) {
      ctx.save();
      if (thing.draw) thing.draw(ctx);
      ctx.restore();
    });
  }

  var requestAnimationFrame = window.requestAnimationFrame || function(func) {
    setTimeout(func, 10);
  }

  function gameLoop() {
    requestAnimationFrame(gameLoop);
    state.currentTick = timestamp();
    if (state.currentTick === state.prevTick) return;
    update();
    state.prevTick = state.currentTick;
    draw();
  }
  gameLoop();

  document.addEventListener('keydown', function(e) {
    console.log(e.keyCode);
    state.keysDown[e.keyCode] = true;
  });
  document.addEventListener('keyup', function(e) {
    state.keysDown[e.keyCode] = false;
  })
}

init();

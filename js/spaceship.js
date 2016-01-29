var SCREEN_WIDTH = 700;
var SCREEN_HEIGHT = 400;
var SHOT_DELAY = 500;
var SHOT_SPEED = 500;
var AIRPLANE_SPEED = 150;
var AIRPLANE_SIZE = 40;

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

function within(thing, x, y) {
  return x >= thing.x && x <= thing.x + thing.width && y >= thing.y && y <= thing.y + thing.height;
}

function hasCornerInside(a, b) {
  return within(a, b.x, b.y) // top left within a
      || within(a, b.x + b.width, b.y) // top right within a
      || within(a, b.x, b.y + b.height) // bottom left within a
      || within(a, b.x + b.width, b.y + b.height) // bottom right
}

function collides(a, b) {
  return (hasCornerInside(a, b) || hasCornerInside(b, a))
    && Math.sqrt(
         Math.pow((a.x + a.width / 2) - (b.x + b.width / 2), 2),
         Math.pow((a.y + a.height / 2) - (b.x + b.height / 2), 2)
       ) < (a.width / 2 + a.height / 2) + (b.width / 2 + b.height / 2);
}

var IMAGES = {
  airplane: createImage('AirPlane.png'),
  bigben: createImage('Big_ben.png'),
  snowman: createImage('Snowman.png'),
};

function Airplane() {
  this.x = (SCREEN_WIDTH / 2) - (AIRPLANE_SIZE / 2);
  this.y = SCREEN_HEIGHT - (AIRPLANE_SIZE / 2);
  this.width = AIRPLANE_SIZE;
  this.height = AIRPLANE_SIZE;
}

Airplane.prototype.draw = function(ctx) {
  ctx.translate(this.x, this.y);
  ctx.rotate(-Math.PI / 4);
  ctx.drawImage(IMAGES.airplane, 0, 0, this.width, this.height);
}

Airplane.prototype.moveLeft = function(state) {
  if (this.x > 0) {
    this.x -= calculateMovement(state, AIRPLANE_SPEED);
  }
}

Airplane.prototype.moveRight = function(state) {
  var screenStop = SCREEN_WIDTH - AIRPLANE_SIZE - 10;
  if (this.x < screenStop) {
    this.x += calculateMovement(state, AIRPLANE_SPEED);
  }
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

Shot.prototype.collide = function(other, state) {
  if (other instanceof Enemy) {
    arrayRemove(state.enemies, other);
  }
}

function Enemy(x, y) {
  this.x = x;
  this.y = y;
  this.width = 40;
  this.height = 40;
}

Enemy.prototype.update = function(state) {
  // TODO
}

Enemy.prototype.draw = function(ctx) {
  ctx.translate(this.x, this.y);
  ctx.drawImage(IMAGES.snowman, 0, 0, this.width, this.height);
}

function init() {
  var state = {
    shots: [],
    enemies: [],
    airplane: new Airplane(),
    keysDown: {},
    prevTick: timestamp(),
    currentTick: null,
  };

  for (var i = 0; i < 20; i++) {
    state.enemies.push(new Enemy(i * 50, 10))
  }

  function getThings() {
    return state.shots.concat(state.enemies).concat(state.airplane);
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

    var things = getThings();
    for (var i = 0; i < things.length; i++) {
      for (var j = i + 1; j < things.length; j++) {
        if (collides(things[i], things[j])) {
          things[i].collide(things[j], state);
        }
      }
    }
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
    // console.log(e.keyCode);
    state.keysDown[e.keyCode] = true;
  });
  document.addEventListener('keyup', function(e) {
    state.keysDown[e.keyCode] = false;
  })
}

init();

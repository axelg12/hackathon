var SCREEN_WIDTH = 700;
var SCREEN_HEIGHT = 400;
var SHOT_DELAY = 500;
var SHOT_SPEED = 500;
var AIRPLANE_SPEED = 150;
var AIRPLANE_SIZE = 40;
var ENEMY_SPEED = 10;
var ENEMY_SHOT_SPEED = 500;
var DEATH_ANIMATION_DURATION = 1000;
var IMAGE_URL = 'http://static.dohop.com/img/away/';

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

function pickRandomImage() {
  var length = window.background.images.length;
  var random = Math.floor(Math.random() * (length));
  return 'url(' + IMAGE_URL + window.background.images[random].id + '_720x500.jpg)' ;
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
  skistick: createImage('ski_stick.png'),
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
    other.die(state);
    arrayRemove(state.shots, this);
  }
}

function resetLevel(state) {
  state.level++;
  document.getElementById("background").style.background = pickRandomImage();
  for (var i = 0; i < 12; i++) {
    state.enemies.push(new Enemy(i * 50, 10))
  }
}

function SuperShot(x, y) {
  this.x = x;
  this.y = y;
  this.width = 40;
  this.height = 40;
}

SuperShot.prototype.update = function() {

}

function Enemy(x, y) {
  this.x = x;
  this.y = y;
  this.width = 40;
  this.height = 40;
  this.start = timestamp();
  this.nextShot = this.start + Math.random() * 5000;
}

Enemy.prototype.update = function(state) {
  if (state.currentTick >= this.nextShot) {
    this.nextShot = timestamp() + 2000 + Math.random() * 5000;
    state.shots.push(new EnemyShot(this.x, this.y + this.height))
  }
}

Enemy.prototype.draw = function(ctx, state) {
  ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
  var rot = (state.currentTick - this.start) % 1000;
  if (rot > 500) rot = 500 - (rot % 500)
  ctx.rotate(Math.PI * (-250 + rot) * 0.0002);
  ctx.translate(-this.width / 2, -this.height / 2)
  ctx.drawImage(IMAGES.snowman, 0, 0, this.width, this.height);
}

Enemy.prototype.die = function(state) {
  this.diedAt = state.currentTick;
  arrayRemove(state.enemies, this);
  state.animations.push(new DeathAnimation(this.x, this.y, this.width, this.height, IMAGES.snowman));
}

function EnemyShot(x, y) {
  this.x = x;
  this.y = y;
  this.width = 20;
  this.height = 20;
}

EnemyShot.prototype.update = function(state) {
  this.y += calculateMovement(state, ENEMY_SHOT_SPEED);
  if (this.y > SCREEN_HEIGHT) {
    arrayRemove(state.shots, this);
  }
}

EnemyShot.prototype.draw = function(ctx, state) {
  ctx.drawImage(IMAGES.skistick, this.x, this.y, this.width, this.height);
}

function DeathAnimation(x, y, width, height, image) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
  this.image = image;
  this.start = timestamp();
}

DeathAnimation.prototype.update = function(state) {
  this.duration = state.currentTick - this.start;
  if (state.currentTick > this.start + DEATH_ANIMATION_DURATION) {
    arrayRemove(state.animations, this);
  }
}

DeathAnimation.prototype.draw = function(ctx) {
  ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
  ctx.rotate(Math.PI * (this.duration / 500));
  ctx.translate(-this.width / 2, -this.height / 2);
  var scale = (DEATH_ANIMATION_DURATION - this.duration) / DEATH_ANIMATION_DURATION;
  ctx.scale(scale, scale);
  ctx.drawImage(this.image, 0, 0, this.width, this.height);
}

function Hivemind() {
  this.direction = 1;
}

Hivemind.prototype.update = function(state) {
  if (this.direction === 1) {
    var max = Math.max.apply(Math, state.enemies.map(function(e) { return e.x + e.width }));
    if (max > SCREEN_WIDTH - 10) {
      this.direction = -1;
      this.drop(state);
    }
  } else {
    var min = Math.min.apply(Math, state.enemies.map(function(e) { return e.x }));
    if (min < 10) {
      this.direction = 1;
      this.drop(state);
    }
  }
  for (var i = 0; i < state.enemies.length; i++) {
    state.enemies[i].x += this.direction * calculateMovement(state, ENEMY_SPEED);
  }
}

Hivemind.prototype.drop = function(state) {
  for (var i = 0; i < state.enemies.length; i++) {
    state.enemies[i].y += state.enemies[i].height + 5;
  }
}

function init() {
  var state = {
    shots: [],
    enemies: [],
    animations: [],
    hivemind: new Hivemind(),
    airplane: new Airplane(),
    keysDown: {},
    prevTick: timestamp(),
    currentTick: null,
    level: 1,
  };

  for (var i = 0; i < 1; i++) {
    state.enemies.push(new Enemy(i * 50, 10))
  }

  function getThings() {
    return state.animations
      .concat(state.shots)
      .concat(state.enemies)
      .concat([state.airplane, state.hivemind]);
  }

  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');

  document.getElementById("background").style.background = pickRandomImage();

  function update() {
    if (state.keysDown[37]) state.airplane.moveLeft(state);
    if (state.keysDown[39]) state.airplane.moveRight(state);
    if (state.keysDown[32]) state.airplane.shoot(state);

    getThings().forEach(function(thing) {
      if (thing.update) thing.update(state);
    });

    var things = getThings();
    for (var i = 0; i < things.length; i++) {
      if (things[i].x == null) continue;
      for (var j = i + 1; j < things.length; j++) {
        if (things[j].x == null) continue;
        if (collides(things[i], things[j])) {
          if (things[i].collide) {
            things[i].collide(things[j], state);
          } else if (things[j].collide) {
            things[j].collide(things[i], state);
          }
        }
      }
    }

    // check if level is done
    if (state.enemies.length == 0 && state.animations.length == 0) {
      resetLevel(state);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    ctx.font = "24px serif";
    ctx.fillStyle = "white";
    ctx.fillText("Level " + state.level, SCREEN_WIDTH / 2 - 50, 50);
    getThings().forEach(function(thing) {
      ctx.save();
      if (thing.draw) thing.draw(ctx, state);
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

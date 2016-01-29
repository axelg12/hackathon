var SCREEN_WIDTH = 700;
var SCREEN_HEIGHT = 400;
var SHOT_DELAY = 500;
var SHOT_SPEED = 500;
var AIRPLANE_SPEED = 150;
var AIRPLANE_SIZE = 40;
var ENEMY_SPEED = 10;
var ENEMY_SHOT_SPEED = 300;
var DEATH_ANIMATION_DURATION = 1000;
var POWER_DROP = 250;
var IMAGE_URL = 'http://static.dohop.com/img/away/';

function timestamp() {
  return Date.now();
}

function createImage(src) {
  var img = new Image();
  img.onerror = function() {
    console.log('could not load ' + src);
  }
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
  man: createImage('Parachute.png'),
  statue: createImage('Statue_of_liberty.png'),
  eiffelTower: createImage('Tokyo_tower.png'),
  supershot: createImage('Party.png'),
  beer: createImage('Beer.png'),
};

function Airplane() {
  this.x = (SCREEN_WIDTH / 2) - (AIRPLANE_SIZE / 2);
  this.y = SCREEN_HEIGHT - (AIRPLANE_SIZE / 2);
  this.width = AIRPLANE_SIZE;
  this.height = AIRPLANE_SIZE;
  this.death = false;
}

Airplane.prototype.draw = function(ctx) {
  if (this.death) {
  } else {
    ctx.translate(this.x, this.y);
    ctx.rotate(-Math.PI / 4);
    ctx.drawImage(IMAGES.airplane, 0, 0, this.width, this.height);
  }
}

Airplane.prototype.update = function (state) {

};

Airplane.prototype.die = function (state) {
  if (!this.death) {
    this.death = true;
    state.animations.push(new AirplaneDeath(this.x, this.y, this.width, this.height));
    state.animations.push(new ParachuteMan(this.x, this.y, this.width, this.height));
  }
};

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
  if (!this.death && (!this.lastShot || this.lastShot < timestamp() - SHOT_DELAY)) {
    this.lastShot = timestamp();
    state.shots.push(new Shot(this.x + this.width / 2, this.y, state.superShot));
    if (state.superShot > 0) state.superShot--;
  }
}

function Shot(x, y, superShot) {
  this.x = x;
  this.y = y;
  this.height = 30;
  this.width = 274 / 960 * this.height;
  this.superShot = superShot;
}

Shot.prototype.update = function(state) {
  var speed = SHOT_SPEED;
  if (this.superShot) speed = SHOT_SPEED / 2;
  this.y -= calculateMovement(state, speed);
  if (this.y <= -this.height) arrayRemove(state.shots, this);
}

Shot.prototype.draw = function(ctx) {
  ctx.translate(this.x, this.y);
  if (this.superShot) {
    ctx.rotate(Math.PI);
    ctx.drawImage(IMAGES.supershot, 0, 0, this.width * 2, this.height *2);
  } else {
    ctx.drawImage(IMAGES.bigben, 0, 0, this.width, this.height);
  }
}

Shot.prototype.collide = function(other, state) {
  if (other instanceof Enemy) {
    other.takeDamage(this.superShot ? 10000 : 1, state);
    if (!this.superShot) arrayRemove(state.shots, this);
  }
  if (other instanceof EnemyShot) {
    arrayRemove(state.shots, this);
    arrayRemove(state.shots, other);
  }
}

function resetLevel(state) {
  state.level++;
  // document.getElementById("background").style.background = pickRandomImage();
  state.enemies = initEnemies(state.level);
}

function initEnemies(level) {
  var enemies = [];
  for (var i = 0; i < 12; i++) {
    for (var j = 0; j < 3; j++) {
      enemies.push(new Enemy(i * 50, 10 + j * 50, level + 2 - j,
        IMAGES[i % 2 == 0 ? 'snowman' : 'statue'],
        IMAGES[i % 2 == 0 ? 'skistick' : 'eiffelTower']
      ));
    }
  }
  return enemies;
}
function PowerUp(x, y) {
  this.x = x;
  this.y = y;
  this.width = 40;
  this.height = 40;
}

PowerUp.prototype.collide = function(thing, state) {
  if (thing instanceof Airplane) {
    arrayRemove(state.powerUps, this);
    state.superShot = 5;
  }
}

PowerUp.prototype.update = function(state) {
  this.y += calculateMovement(state, POWER_DROP);
  if (this.y > SCREEN_HEIGHT) {
    arrayRemove(state.shots, this);
  }
}

PowerUp.prototype.draw = function(ctx, state) {
  ctx.drawImage(IMAGES.beer, this.x, this.y, this.width, this.height);
}


function Enemy(x, y, shield, image, shotImage) {
  this.x = x;
  this.y = y;
  this.width = 40;
  this.height = 40;
  this.shield = shield;
  this.image = image;
  this.shotImage = shotImage;
  this.start = timestamp();
  this.nextShot = this.start + Math.random() * 10000;
}

Enemy.prototype.update = function(state) {
  if (state.currentTick >= this.nextShot) {
    console.log('shotImage', this.shotImage.src);
    this.nextShot = timestamp() + 2000 + Math.random() * 10000;
    state.shots.push(new EnemyShot(this.x, this.y + this.height, this.shotImage))
  }
}

Enemy.prototype.draw = function(ctx, state) {
  ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
  var rot = (state.currentTick - this.start) % 1000;
  if (rot > 500) rot = 500 - (rot % 500)
  ctx.rotate(Math.PI * (-250 + rot) * 0.0002);
  ctx.translate(-this.width / 2, -this.height / 2)
  ctx.drawImage(this.image, 0, 0, this.width, this.height);
}

Enemy.prototype.takeDamage = function(points, state) {
  this.shield -= points;
  if (this.shield <= 0) {
    this.diedAt = state.currentTick;
    if (Math.random() < 1 / 5) {
      state.powerUps.push(new PowerUp(this.x, this.y, this.width, this.height))
    };

    arrayRemove(state.enemies, this);
    state.animations.push(new DeathAnimation(this.x, this.y, this.width, this.height, this.image));
  }
}

function EnemyShot(x, y, image) {
  this.x = x;
  this.y = y;
  this.width = 20;
  this.height = 20;
  this.image = image;
}

EnemyShot.prototype.update = function(state) {
  this.y += calculateMovement(state, ENEMY_SHOT_SPEED);
  if (this.y > SCREEN_HEIGHT) {
    arrayRemove(state.shots, this);
  }
}

EnemyShot.prototype.draw = function(ctx, state) {
  ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
}

EnemyShot.prototype.collide = function(thing, state) {
  if (thing instanceof Airplane) {
    state.airplane.die(state);
  }

  if (thing instanceof Shot) {
    thing.collide(this, state);
  }
}

function ParachuteMan(x, y, width, height) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
  this.start = timestamp();
}

ParachuteMan.prototype.update = function(state) {
  this.duration = state.currentTick - this.start;
  if (state.currentTick > this.start + DEATH_ANIMATION_DURATION * 2) {
    arrayRemove(state.animations, this);
  }
}

ParachuteMan.prototype.draw = function(ctx) {
  if (this.duration > (DEATH_ANIMATION_DURATION / 3)) {
    this.y++;
  } else {
    this.y -= 2;
  }
  ctx.translate(this.x, this.y);
  var scale = (DEATH_ANIMATION_DURATION * 1.5 - this.duration) / DEATH_ANIMATION_DURATION;
  ctx.scale(scale, scale);
  ctx.translate(-this.width / 2, -this.height / 2);
  ctx.drawImage(IMAGES.man, 0, 0, this.width, this.height);
}

function AirplaneDeath(x, y, width, height) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
  this.start = timestamp();
}

AirplaneDeath.prototype.update = function(state) {
  this.duration = state.currentTick - this.start;
  if (state.currentTick > this.start + DEATH_ANIMATION_DURATION) {
    arrayRemove(state.animations, this);
  }
}

AirplaneDeath.prototype.draw = function(ctx) {
  ctx.translate(this.x - this.width / 2, this.y - this.height / 2);
  ctx.rotate(Math.PI * (this.duration / 500));
  ctx.translate(-this.width / 2, -this.height / 2);
  var scale = (DEATH_ANIMATION_DURATION - this.duration) / DEATH_ANIMATION_DURATION;
  ctx.scale(scale, scale);
  ctx.drawImage(IMAGES.airplane, 0, 0, this.width, this.height);
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
  if (state.enemies.length == 0) return;

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
function reset(state) {
  state.shots = [];
  state.enemies = initEnemies(state.level);
  state.animations = [];
  state.hivemind = new Hivemind();
  state.airplane = new Airplane();
  state.keysDown = {};
  state.prevTick = timestamp();
  state.currentTick = timestamp();
  state.level = 1;
}
function init() {
  var state = {
    shots: [],
    powerUps: [],
    enemies: initEnemies(1),
    superShot: 0,
    animations: [],
    hivemind: new Hivemind(),
    airplane: new Airplane(),
    keysDown: {},
    prevTick: timestamp(),
    currentTick: timestamp(),
    level: 1,
  };

  function getThings() {
    return state.animations
      .concat(state.powerUps)
      .concat(state.shots)
      .concat(state.enemies)
      .concat([state.airplane, state.hivemind]);
  }

  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');

  //document.getElementById("background").style.background = pickRandomImage();

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
          }
          if (things[j].collide) {
            things[j].collide(things[i], state);
          }
        }
      }
    }

    // check if level is done
    if (state.enemies.length == 0 && state.animations.length == 0) {
      resetLevel(state);
    }
    if (state.airplane.death && state.animations.length == 0) {
      reset(state);
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
    state.keysDown[e.keyCode] = true;
  });
  document.addEventListener('keyup', function(e) {
    state.keysDown[e.keyCode] = false;
  })
}

init();

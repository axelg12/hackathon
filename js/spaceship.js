var SCREEN_WIDTH = 750;
var SCREEN_HEIGHT = 400;

function Airplane() {
  this.x = 350;
  this.y = 350;
}

var img = new Image();
img.src = '/images/Air plane.png';

Airplane.prototype.draw = function(ctx) {
  ctx.translate(this.x, this.y);
  ctx.rotate(-Math.PI / 4);
  ctx.drawImage(img, 0, 0, 50, 50);
}

Airplane.prototype.moveLeft = function() {
  this.x -= 3;
}

Airplane.prototype.moveRight = function() {
  this.x += 3;
}

function init() {
  var canvas = document.getElementById('canvas');
  var airplane = new Airplane();
  var keysDown = {};

  var ctx = canvas.getContext('2d');

  function update() {
    if (keysDown[37]) airplane.moveLeft();
    if (keysDown[39]) airplane.moveRight();

    ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    ctx.save();
    airplane.draw(ctx);
    ctx.restore();
  }

  setInterval(update, 1000 / 60);

  document.addEventListener('keydown', function(e) {
    keysDown[e.keyCode] = true;
  });
  document.addEventListener('keyup', function(e) {
    keysDown[e.keyCode] = false;
  })
}

init();

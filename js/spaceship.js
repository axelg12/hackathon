function init() {
  var canvas = document.getElementById('canvas');
  console.log('here');
  if (canvas.getContext) {
    var ctx = canvas.getContext('2d');
    console.log('context');
    var img = new Image();
    img.onload = function() {
      ctx.rotate(-0.75);
      ctx.drawImage(img, -250, 0, 50, 50);
      ctx.rotate(1);
    }
    img.src = '/images/Air plane.png';
  }
}
init();

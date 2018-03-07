function map(n, start1, stop1, start2, stop2, withinBounds) {
  var newval = (n - start1) / (stop1 - start1) * (stop2 - start2) + start2;
  if (!withinBounds) {
    return newval;
  }
  if (start2 < stop2) {
    return constrain(newval, start2, stop2);
  } else {
    return constrain(newval, stop2, start2);
  }
}

function constrain(n, low, high) {
  return Math.max(Math.min(n, high), low);
}

function rand(min, max) {
  return Math.round(rand_float(min, max));
}

function rand_float(min, max) {
  
  if (min > max) {
    [min, max] = [max, min];
  }
  
  return Math.random() * (max - min) + min;
}

function loadImages(image) {
  if (!image) {
    return Promise.reject();
  } else if (typeof image === "string") {
    /* Create a <img> from a string */
    const src = image;
    image = new Image();
    image.src = src;
  } else if (image.length !== undefined) {
    /* Treat as multiple images */

    // Momentarily ignore errors
    const reflected = [].map.call(image, img => loadImages(img).catch(err => err));

    return Promise.all(reflected).then(results => {
      const loaded = results.filter(x => x.naturalWidth);
      if (loaded.length === results.length) {
        return loaded;
      }
      return Promise.reject({
        loaded,
        errored: results.filter(x => !x.naturalWidth)
      });
    });
  } else if (image.tagName !== "IMG") {
    return Promise.reject();
  }

  const promise = new Promise((resolve, reject) => {
    if (image.naturalWidth) {
      // If the browser can determine the naturalWidth the
      // image is already loaded successfully
      resolve(image);
    } else if (image.complete) {
      // If the image is complete but the naturalWidth is 0px
      // it is probably broken
      reject(image);
    } else {
      image.addEventListener("load", fullfill);
      image.addEventListener("error", fullfill);
    }
    function fullfill() {
      if (image.naturalWidth) {
        resolve(image);
      } else {
        reject(image);
      }
      image.removeEventListener("load", fullfill);
      image.removeEventListener("error", fullfill);
    }
  });
  promise.image = image;
  return promise;
}

function direction() {
  return rand(0, 1) === 1 ? 1 : -1;
}

function SnowFlake(options, ctx) {
  let defaults = {
    maxSize: 30,
    minSize: 4,
    speed: 1,
    fov: 20,
    rotate: 1,
    flip: 1,
    wave: 30,
    gravity: 0,
    images: []
  };

  let config = Object.assign({}, defaults, options);

  let image = config.images[rand(0, config.images.length - 1)];

  let x, y, z, size;
  let depth,
    yspeed,
    xspeed = 0,
    xTranslateOffset,
    gravity;
  let rotate = 0,
    rotateSpeed;
  let flip = 1,
    flipSpeed;
  let time = 0;

  reset();

  y = rand(-size / 2, ctx.canvas.height + size);

  function reset() {
    x = rand(0, ctx.canvas.width);
    z = rand(0, config.fov);
    depth = map(z, 0, config.fov, 0, 1);
    size = map(config.maxSize * depth, 0, config.maxSize, config.minSize, config.maxSize);
    y = -size;
    yspeed = map(depth, 0, 1, 1, 5) / 10 * config.speed;
    xspeed = rand_float(0, 0.05) * direction();
    rotateSpeed = rand_float(0, 0.1) * direction() * config.rotate;
    flipSpeed = rand_float(0, 0.01) * direction() * config.flip;
    xTranslateOffset = rand_float(0, 1) * direction();
  }

  this.update = function() {
    time += xspeed;
    yspeed += config.gravity;
    y += yspeed;
    x += (Math.sin(time) + xTranslateOffset) * depth;
    rotate += rotateSpeed;
    flip += flipSpeed;

    if (time >= config.wave * depth || time <= -config.wave * depth) {
      xspeed *= -1;
    }

    if (flip <= 0 || flip >= 1) {
      flipSpeed *= -1;
    }

    if (y > ctx.canvas.height) {
      reset();
    }
  };

  this.draw = function() {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotate * Math.PI / 180);
    ctx.scale(flip, 1);

    ctx.drawImage(image, -size / 2, -size / 2, size, size);
    ctx.restore();
  };
}

let images = [
  "https://e-webdev.ru/assets/images/flakes/flake1.png",
  "https://e-webdev.ru/assets/images/flakes/flake2.png",
  "https://e-webdev.ru/assets/images/flakes/flake3.png",
  "https://e-webdev.ru/assets/images/flakes/flake4.png",
  "https://e-webdev.ru/assets/images/flakes/flake5.png",
  "https://e-webdev.ru/assets/images/flakes/flake6.png",
  "https://e-webdev.ru/assets/images/flakes/flake7.png"
];

loadImages(images).then(function(images) {
  let snow = [];
  let count = 100;
  let options = {
    maxSize: 64,
    minSize: 1,
    speed: 5,
    fov: 1000,
    rotate: 10,
    flip: 5,
    wave: 30,
    gravity: 0.0,
    images: images
  };

  let canvas = document.createElement("canvas");
  canvas.setAttribute("id", "Show");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  let ctx = canvas.getContext("2d");

  document.body.appendChild(canvas);

  for (let i = 0; i < count; i++) {
    let imageId = rand(0, images.lenght);
    snow.push(new SnowFlake(options, ctx));
  }

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    snow.forEach(function(snowFlake) {
      snowFlake.update();
      snowFlake.draw();
    });

    window.requestAnimationFrame(() => update());
  }

  update();
  window.addEventListener("resize", () => resize());
});
let canvas, ctx, mousePos;

// Autres joueurs
let allPlayers = {};
let target = {x:250, y:260, radius:20, color:'yellow'};

let obstacles = [];
let obstaclesVerticaux = [];
let playerSpeed = 100; // 100 pixels/s

let delta, oldTime = 0;

var level = 1;

var nbClientUpdatesPerSeconds=10;

function startGame() {
  console.log("init");
  canvas = document.querySelector("#myCanvas");
  ctx = canvas.getContext("2d");
  lvl = document.querySelector("#lvl");

  // Les écouteurs
  //canvas.addEventListener("mousedown", traiteMouseDown);
  //canvas.addEventListener("mousemove", traiteMouseMove);

  canvas.onkeydown = processKeydown;
  canvas.onkeyup = processKeyup;

  createObstacles();

  requestAnimationFrame(animationLoop);
}

function createObstacles() {
  let o1 = {x:70, y:50, width:20, height:100, color:"black", vy:150, range:100}
  let o2 = {x:170, y:50, width:20, height:50, color:"orange", vy:70, range:100}
  let o3 = {x:20, y:130, width:100, height:20, color:"red", vx:100, range:100}
  let o4 = {x:3, y:190, width:100, height:20, color:"red", vx:110, range:100}
  let o5 = {x:195, y:170, width:20, height:20, color:"black", vy:400, range:100}
  let o6 = {x:160, y:170, width:20, height:20, color:"black", vy:350, range:100}
  let o7 = {x:160, y:190, width:20, height:20, color:"red", vx:400, range:100}
  switch(level){
    case 1 :{
      obstacles.push(o1);
      obstacles.push(o2);
      break;
    };
    case 2 :{
      obstaclesVerticaux.push(o3);
      //target.radius = 30;
      break;
    }
    case 3 :{
      obstaclesVerticaux.push(o4);
      /*target.x = 220;
      target.y = 240;*/
      break;
    }
    case 4 :{
      obstacles.push(o5);
      break;
    }
    case 5 :{
      obstacles.push(o6);
      obstaclesVerticaux.push(o7);
      break;
    }
  }
}

function processKeydown(event) {
  event.preventDefault();
  event.stopPropagation(); // avoid scrolling with arri-ow keys

  switch (event.key) {
    case "ArrowRight":
      allPlayers[username].vx = playerSpeed;
      break;
    case "ArrowLeft":
      allPlayers[username].vx = -playerSpeed;
      break;
    case "ArrowUp":
      allPlayers[username].vy = -playerSpeed;
      break;
    case "ArrowDown":
      allPlayers[username].vy = playerSpeed;
      break;
  }

  //console.log('keydown key = ' + event.key);
}

function processKeyup(event) {
  switch (event.key) {
    case "ArrowRight":
    case "ArrowLeft":
      allPlayers[username].vx = 0;
      break;
    case "ArrowUp":
    case "ArrowDown":
      allPlayers[username].vy = 0;
      break;
  }
}

function traiteMouseDown(evt) {
  console.log("mousedown");
}

function traiteMouseMove(evt) {
  console.log("mousemove");

  mousePos = getMousePos(canvas, evt);
  //console.log(mousePos.x + " " + mousePos.y);

  allPlayers[username].x = mousePos.x;
  allPlayers[username].y = mousePos.y;

  console.log("On envoie sendPos");
  let pos = { user: username, pos: mousePos };
  socket.emit("sendpos", pos);
}

function updatePlayerNewPos(newPos) {
  allPlayers[newPos.user].x = newPos.pos.x;
  allPlayers[newPos.user].y = newPos.pos.y;
}

// Mise à jour du tableau quand un joueur arrive
// ou se deconnecte
function updatePlayers(listOfPlayers) {
  allPlayers = listOfPlayers;
}

function drawPlayer(player) {
  ctx.save();

  ctx.translate(player.x, player.y);

  ctx.strokeStyle = "green";
  ctx.fillRect(0, 0, 10, 10);

  ctx.restore();
}

function drawAllPlayers() {
  for (let name in allPlayers) {
    drawPlayer(allPlayers[name]);
  }
}

function getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top,
  };
}

function updateClient() {
  clientTime = document.querySelector("#clientTime");
  clientTime*1000;
  /*setInterval(()=>{
    if (allPlayers[username] !== undefined) {
      clientTime = document.querySelector("#clientTime");
      clientTime*1000;
      socket.emit("updateClient", username, clientTime, allPlayers[username].x, allPlayers[username].y, allPlayers[username].vx, allPlayers[username].vy);
    }
  }, clientTime);*/
}

function moveCurrentPlayer() {
  if (allPlayers[username] !== undefined) {
    allPlayers[username].x += calcDistanceToMove(delta, allPlayers[username].vx);
    allPlayers[username].y += calcDistanceToMove(delta, allPlayers[username].vy);
    socket.emit("sendpos", { user: username, pos: allPlayers[username]});
    //updateClient();
  }
}

function drawTarget() {
  ctx.save();

  ctx.translate(target.x, target.y);

  // draws the target as a circle
  ctx.beginPath();
  ctx.fillStyle = target.color;
  ctx.arc(0, 0, target.radius, 0, Math.PI*2);
  ctx.fill();

  ctx.lineWidth=5;
  ctx.strokeStyle = "black";
  ctx.stroke();

  ctx.restore();
}

// Collisions between rectangle and circle
function circRectsOverlap(x0, y0, w0, h0, cx, cy, r) {
  var testX=cx; 
  var testY=cy; 
  
  if (testX < x0) testX=x0; 
  if (testX > (x0+w0)) testX=(x0+w0); 
  if (testY < y0) testY=y0; 
  if (testY > (y0+h0)) testY=(y0+h0); 

  return (((cx-testX)*(cx-testX)+(cy-testY)*(cy-testY))<r*r); 
}

// Collisions between rectangle and rectangle
function rectRectsOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
  if ((x1 > (x2 + w2)) || ((x1 + w1) < x2)) {
    return false;
  }
  if ((y1 > (y2 + h2)) || ((y1 + h1) < y2)) {
    return false;
  }
  return true;
}

function checkIfPlayerHitTarget(player) {
  if(player === undefined) return;

  if(circRectsOverlap(player.x, player.y, 10, 10, target.x, target.y, target.radius)) {
    console.log("COLLISION TARGET REACHED BY PLAYER");
    target.color = "red";
    player.x = 10;
    player.y = 10;
    level++;
    lvl.innerHTML = "Level " + level;
    createObstacles();
  } else {
    target.color = "yellow";
  }
  
  obstaclesVerticaux.forEach(o => {
    if(rectRectsOverlap(player.x, player.y, 10, 10, o.x, o.y, o.width, o.height)) {
      console.log("A PLAYER HAS BEEN KILLED BY A MONSTER");
      player.x = 10;
      player.y = 10;
    }
  });

  obstacles.forEach(o => {
    if(rectRectsOverlap(player.x, player.y, 10, 10, o.x, o.y, o.width, o.height)) {
      console.log("A PLAYER HAS BEEN KILLED BY A MONSTER");
      player.x = 10;
      player.y = 10;
    }
  });
}

function drawObstacles() {
  ctx.save();

  obstaclesVerticaux.forEach(o => {
    ctx.fillStyle = o.color;
    ctx.fillRect(o.x, o.y, o.width, o.height);

    o.x += calcDistanceToMove(delta,o.vx);
    //o.x += o.vx;
    if(o.x > 250) {
      o.x = 249; 
      o.vx = -o.vx;
    }

    if(o.x < 0) {
      o.x = 1;
      o.vx = -o.vx;
    }
  });

  obstacles.forEach(o => {
    ctx.fillStyle = o.color;
    ctx.fillRect(o.x, o.y, o.width, o.height);

    o.y += calcDistanceToMove(delta,o.vy);
    //o.y += o.vy;
    if(o.y > 250) {
      o.y = 249; 
      o.vy = -o.vy;
    }

    if(o.y <0) { 
      o.y = 1;
      o.vy = -o.vy;
    }
  });

  ctx.restore();
}

// returns the time elapsed since last frame has been drawn, in seconds
function timer(currentTime) {
  delta = currentTime - oldTime;
  oldTime = currentTime;
  return delta/1000;
}

function animationLoop(time) {
  delta = timer(time); // delta is in seconds

  if (username != undefined) {
    // 1 On efface l'écran
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2 On dessine des objets
    drawAllPlayers();

    drawTarget();
    drawObstacles();

    moveCurrentPlayer();
    checkIfPlayerHitTarget(allPlayers[username]);

    //checkCollisionsPlayerWithObstacles()
  }

  // 3 On rappelle la fonction d'animation à 60 im/s
  requestAnimationFrame(animationLoop);
}

// Delta in seconds, speed in pixels/s
var calcDistanceToMove = function(delta, speed) {
  //console.log("#delta = " + delta + " speed = " + speed);
  return (speed * delta); 
};

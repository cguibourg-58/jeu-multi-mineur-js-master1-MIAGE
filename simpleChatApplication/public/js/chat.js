let username;
let conversation, data, datasend, users, heartbeat;

let artificialLatencyDelay=0;

var nbUpdatesPerSec;

var nbClientUpdatesPerSeconds=10;

let socket;

var clientTime;

//var clientTime;

// on load of page
window.onload = init;

function init() {
  username = prompt("Quel est votre nom?");

  // initialize socket.io client-side
  socket = io.connect();

  // get handles on various GUI components
  conversation = document.querySelector("#conversation");
  data = document.querySelector("#data");
  datasend = document.querySelector("#datasend");
  users = document.querySelector("#users");

  // Listener for send button
  datasend.onclick = (evt) => {
    sendMessage();
  };

  // detect if enter key pressed in the input field
  data.onkeypress = (evt) => {
    // if pressed ENTER, then send
    if (evt.keyCode == 13) {
      this.blur();
      sendMessage();
    }
  };

  data.onblur = (event) => {
    console.log("Input field lost focus");
    canvas.focus(); // gives the focus to the canvas
  }

  // sends the chat message to the server
  function sendMessage() {
    let message = data.value;
    data.value = "";
    // tell server to execute 'sendchat' and send along one parameter
    socket.emit("sendchat", message);
  }
  // on connection to server, ask for user's name with an anonymous callback
  socket.on("connect", () => {
    clientStartTimeAtConnection = Date.now();

    // call the server-side function 'adduser' and send one parameter (value of prompt)
    socket.emit("adduser", username);
  });

  // listener, whenever the server emits 'updatechat', this updates the chat body
  socket.on("updatechat", (username, data) => {
    let chatMessage = "<b>" + username + ":</b> " + data + "<br>";
    conversation.innerHTML += chatMessage;
  });

  // just one player moved
  socket.on("updatepos", (username, newPos) => {
    updatePlayerNewPos(newPos);
  });

  // listener, whenever the server emits 'updateusers', this updates the username list
  socket.on("updateusers", (listOfUsers) => {
    users.innerHTML = "";
    for (let name in listOfUsers) {
      let userLineOfHTML = "<div>" + name + "</div>";
      users.innerHTML += userLineOfHTML;
    }
  });

  // update the whole list of players, useful when a player
  // connects or disconnects, we must update the whole list
  socket.on("updatePlayers", (listOfplayers) => {
    updatePlayers(listOfplayers);
  });

  // Latency, ping etc.
  socket.on("ping", () => {
    send("pongo");
  });

  socket.on("data", (timestamp, rtt, serverTime) => {
    //console.log("rtt time received from server " + rtt);

    let spanRtt = document.querySelector("#rtt");
    spanRtt.innerHTML = rtt;

    let spanPing = document.querySelector("#ping");
    spanPing.innerHTML = (rtt/2).toFixed(1);

    let spanServerTime = document.querySelector("#serverTime");
    spanServerTime.innerHTML = (serverTime/1000).toFixed(5);

    clientTime = Date.now() - clientStartTimeAtConnection;

    let spanClientTime = document.querySelector("#clientTime");
    spanClientTime.innerHTML = (clientTime/1000).toFixed(5);
  
  });

  socket.on("heartbeat", (nbUpdatesPerSeconds /*, posX*/) => {
    //nbUpdatesPerSec=nbUpdatesPerSeconds;
    //console.log("<< perseconds:"+nbUpdatesPerSeconds+"   perSec:"+nbUpdatesPerSec);
    if(nbUpdatesPerSeconds!=nbUpdatesPerSec){
      nbUpdatesPerSec = nbUpdatesPerSeconds;
      console.log("<< update heartbeat : "+nbUpdatesPerSec);
      let heartbeatValue = document.querySelector("#heartbeat");
      heartbeatValue.innerHTML = nbUpdatesPerSec;
      let heartbeatslider = document.querySelector("#heartbeatslider");
      heartbeatslider.value = nbUpdatesPerSec;
    }
    console.log("<< heartbeat : "+nbUpdatesPerSec);
  });
/*
  socket.on("heartbeat", (nbUpdatesPerSeconds, posX)=> {
    //console.log("PosX : "+posX);
  });
  */

  /*setInterval(()=>{
		socket.emit("updateClient", username, clientTime,);
	}, 1000/nbClientUpdatesPerSeconds);*/

  /*socket.on("nbUpdatesPerSeconds", (nbUpdatesPerSeconds) => {
    console.log("update heartbeat : "+nbUpdatesPerSec);
  });

  socket.on("initUpdatesPerSeconds", (nbUpdatesPerSeconds) => {
    console.log("coucou je suis l?? alooooooooo ????");
    nbUpdatesPerSec = nbUpdatesPerSeconds;
  });*/
 
  // we start the Game
  startGame();
}

// PERMET D'ENVOYER SUR WEBSOCKET en simulant une latence (donn??e par la valeur de delay)
function send(typeOfMessage, data) {
  setTimeout(() => {
      socket.emit(typeOfMessage, data)
  }, artificialLatencyDelay);
}

function changeArtificialLatency(value) {
  artificialLatencyDelay = parseInt(value);

  let spanDelayValue = document.querySelector("#delay");
  spanDelayValue.innerHTML = artificialLatencyDelay;
}

function changeHeartbeat(value) {
  heartbeat = parseInt(value);

  //let heartbeatValue = document.querySelector("#heartbeat");
  //heartbeatValue.innerHTML = heartbeat;
}

function validateChange() {
  console.log(">> heartbeat new value : "+heartbeat);
  socket.emit("changeNbUpdates",heartbeat);
}

const socket = io("/");  //socket connection
const videoGrid = document.getElementById('video-grid');
const userDropDown = document.getElementById('myDropdown');
const myVideo = document.createElement('video');
myVideo.muted = true;
let peers = {}, currentPeer = [];
let userlist = [];
let cUser;

let YourName = prompt('Type Your Name');
console.log(YourName);

var peer = new Peer();

let myVideoStream;
navigator.mediaDevices.getUserMedia({     //access user device media(audio, video)
  video: true,
  audio: true
}).then(stream => {                        //send our stream
  addVideoStream(myVideo, stream);
  myVideoStream = stream;

  peer.on('call', call => {               //receivers answer the call and send back their stream
    console.log("answered");
    call.answer(stream);               //send video stream to caller
    const video = document.createElement('video');

    peers[call.peer] = call;   //storing the call info of the caller, call.peer gives the id of the peer who called

    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream);
    });
    //currentPeer = call.peerConnection;
    currentPeer.push(call.peerConnection);
  
    call.on('close', function () {       //when the call is over
      video.remove();
    });
    // use call.close() to finish a call
  });

  socket.on('user-connected', (userId) => {   //new user connected so we are now ready to share
    console.log('user ID fetch connection: ' + userId); //our video stream
    connectToNewUser(userId, stream);        //by this function which calls the user
  })

});


//if someone tries to join room
peer.on('open', async id => {
  cUser = id;                    //current user's peer id
  // console.log("Current user: "+id);
  await socket.emit('join-room', ROOM_ID, id, YourName);
})

socket.on('user-disconnected', userId => {   //user disconnected
  
  if (peers[userId])                  //close the call of the user disconnected
  peers[userId].close();

  console.log('user ID fetch Disconnect: ' + userId);
});


const connectToNewUser = (userId, stream) => {
  console.log('User-connected :-' + userId);
  let call = peer.call(userId, stream);       //call the new user and send our video stream
  //currentPeer = call.peerConnection;
  const video = document.createElement('video');
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream);  // Show stream in some video/canvas element
  })
  call.on('close', () => {
    video.remove()
  })
  //currentPeer = call.peerConnection;
  peers[userId] = call;
  currentPeer.push(call.peerConnection);
  console.log(currentPeer);
}


const addVideoStream = (video, stream) => {      //append or add video stream to our UI
  video.srcObject = stream;
  video.controls = true;
  video.addEventListener('loadedmetadata', () => {
    video.play();
  })
  videoGrid.append(video);
}

//to Mute or Unmute Option method
const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setMuteButton();
  } else {
    setUnmuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
}

const setUnmuteButton = () => {
  const html = `<i class="fas fa-microphone"></i>
                <span>Mute</span>`;
  document.querySelector('.Mute__button').innerHTML = html;
  console.log("You are Unmuted");
}

const setMuteButton = () => {
  const html = `<i class="fas fa-microphone-slash" style="color:red;"></i>
                <span>Unmute</span>`;
  document.querySelector('.Mute__button').innerHTML = html;
  console.log("Muted");
}

//Video ON or OFF
const videoOnOff = () => {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    unsetVideoButton();
  } else {
    setVideoButton();
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
}

const setVideoButton = () => {
  const html = `<i class="fas fa-video"></i>
                <span>Stop Video</span>`;
  document.querySelector('.Video__button').innerHTML = html;
  console.log("Cammera Mode ON");
}

const unsetVideoButton = () => {
  const html = `<i class="fas fa-video-slash" style="color:red;"></i>
                <span>Start Video</span>`;
  document.querySelector('.Video__button').innerHTML = html;
  console.log("Cammera Mode OFF");
}

//code for disconnecting from client
const disconnectNow = () => {
  // window.location = "http://localhost:3000/";
  window.location = "/";
}

//code to share url of roomId
const share = () => {
  var share = document.createElement('input'),
    text = window.location.href;

  console.log(text);
  document.body.appendChild(share);
  share.value = text;
  share.select();
  document.execCommand('copy');
  document.body.removeChild(share);
  alert('Copied');
}
//msg send from user
let text = $('input');

$('html').keydown((e) => {
  if (e.which == 13 && text.val().length !== 0) {
    console.log(text.val());
    socket.emit('message', text.val(), YourName);
    text.val('')
  }
});

//Print msg in room
socket.on('createMessage', (msg, user) => {
  $('ul').append(`<li class= "message"><p style="color:red;padding:0;border:none;margin:0">~${user}</p>${msg}</li><br>`);
  scrollToBottom();
});

const scrollToBottom = () => {
  var d = $('.main__chat_window');
  d.scrollTop(d.prop("scrollHeight"));
}

//screenShare
const screenshare = () => {
  navigator.mediaDevices.getDisplayMedia({
    video: {
      cursor: 'always'
    },
    audio: {
      echoCancellation: true,
      noiseSupprission: true
    }

  }).then(stream => {
    let videoTrack = stream.getVideoTracks()[0];
    videoTrack.onended = function () {
      stopScreenShare();
    }
    for (let x = 0; x < currentPeer.length; x++) {

      let sender = currentPeer[x].getSenders().find(function (s) {
        return s.track.kind == videoTrack.kind;
      })

      sender.replaceTrack(videoTrack);
    }

  })

}

function stopScreenShare() {
  let videoTrack = myVideoStream.getVideoTracks()[0];
  for (let x = 0; x < currentPeer.length; x++) {
    let sender = currentPeer[x].getSenders().find(function (s) {
      return s.track.kind == videoTrack.kind;
    })
    sender.replaceTrack(videoTrack);
  }
}

//raised hand
const raisedHand = () => {
  const sysbol = "&#9995;";
  socket.emit('message', sysbol, YourName);
  unChangeHandLogo();
}

const unChangeHandLogo = () => {
  const html = `<i class="far fa-hand-paper" style="color:red;"></i>
                <span>Raised</span>`;
  document.querySelector('.raisedHand').innerHTML = html;
  console.log("change")
  changeHandLogo();
}

const changeHandLogo = () => {
  setInterval(function () {
    const html = `<i class="far fa-hand-paper" style="color:"white"></i>
                <span>Hand</span>`;
    document.querySelector('.raisedHand').innerHTML = html;
  }, 3000);
}

//kick option
socket.on('remove-User', (userR) => {
  if (cUser == userR) {
    disconnectNow();
  }
});

const getUsers = () => {
  socket.emit('seruI');
}

let host = "";

socket.on("get-host", (hostUser) => {
  console.log("Host-" + hostUser);
  host = hostUser;
})

const listOfUser = () => {
  userDropDown.innerHTML = '';
  // while (userDropDown.firstChild) {
  //   userDropDown.removeChild(userDropDown.lastChild);
  // }

  for (var i = 0; i < userlist.length; i++) {
    var x = document.createElement("a");
    var t = document.createTextNode(userlist[i].uid === host ? `${userlist[i].name} (Host)` : `${userlist[i].name}`);
    x.appendChild(t);
    userDropDown.append(x);
  }
  const anchors = document.querySelectorAll('a');
  for (let i = 0; i < anchors.length; i++) {
    anchors[i].addEventListener('click', () => {
      console.log(`Link is clicked ${i}`);
      anchoreUser(userlist[i].uid);
    });
  }
}

const anchoreUser = (userR) => {
  socket.emit('removeUser', cUser, userR);
}


socket.on('all_users_inRoom', (userI) => {
  console.log(userI);
  // userlist.splice(0,userlist.length);
  userlist = [];
  userlist = userI;
  console.log(userlist);
  listOfUser();
  document.getElementById("myDropdown").classList.toggle("show");
});
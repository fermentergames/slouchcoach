// Javascript Stuff


  // More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/pose

// the link to your model provided by Teachable Machine export panel
const URL = "https://teachablemachine.withgoogle.com/models/CDfW_tHo-/";
let model, webcam, ctx, labelContainer, maxPredictions, slouchContainer, postureDisplay, startButton, stopButton, emojiOverlay;

var inited = 0;
var loadingcam = 0;
var time = 0;
var BestTime = 0;

var slouching = 0;

emojiOverlay = document.getElementById("emoji-overlay");


document.getElementById("start-button").addEventListener("mouseenter", mouseEnterBtn);
document.getElementById("start-button").addEventListener("mouseleave", mouseLeaveBtn);
document.getElementById("start-button").addEventListener("click", ClickBtn);



function mouseEnterBtn() {
  
  if (loadingcam <= 0) {
    document.getElementById("canvas-wrapper").classList.add("active");

    emojiOverlay.classList.remove("fa-smile-beam");
    emojiOverlay.classList.add("fa-laugh-beam");
  }
}

function mouseLeaveBtn() {
  
  if (loadingcam <= 0) {
    
    document.getElementById("canvas-wrapper").classList.remove("active");
    emojiOverlay.classList.add("fa-smile-beam");
    emojiOverlay.classList.remove("fa-laugh-beam");
    
  }
}

function ClickBtn() {
  init()
  loadingcam = 1;
  emojiOverlay.classList.remove("fa-smile-beam");
  emojiOverlay.classList.remove("fa-laugh-beam");
  emojiOverlay.classList.add("fa-laugh");
  
  document.body.classList.add("loading");
  
  document.getElementById("start-button").disabled = true;
  
}


async function init() {
  const modelURL = URL + "model.json";
  const metadataURL = URL + "metadata.json";

  // load the model and metadata
  // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
  // Note: the pose library adds a tmPose object to your window (window.tmPose)
  model = await tmPose.load(modelURL, metadataURL);
  maxPredictions = model.getTotalClasses();

  // Convenience function to setup a webcam
  const size = 500;
  const flip = true; // whether to flip the webcam
  webcam = new tmPose.Webcam(size, size, flip); // width, height, flip
  await webcam.setup(); // request access to the webcam
  await webcam.play();
  //window.requestAnimationFrame(loop);
  setTimeout(loop, 20); // fixed 20ms delay

  // append/get elements to the DOM
  const canvas = document.getElementById("canvas");
  canvas.width = size; canvas.height = size;
  ctx = canvas.getContext("2d");
  labelContainer = document.getElementById("label-container");
  
  labelContainer.innerHTML = ''; //reset
  
  for (let i = 0; i < maxPredictions; i++) { // add class labels
    labelContainer.appendChild(document.createElement("div"));
  }


  //ace stuff
  slouchContainer = document.getElementById("slouch-container");
  postureDisplay = document.getElementById("posture-display");
  startButton = document.getElementById("start-button");
  stopButton = document.getElementById("stop-button");
  labelContainer.classList.remove("hidden");
  
  startButton.classList.add("hidden");
  stopButton.classList.remove("hidden");
  
  inited = 1;
  loadingcam = 0;
  
  document.body.classList.add("inited");
  document.body.classList.remove("loading");
  
  
}



function stop() {
  
  webcam.stop();
  
  //reset everything
  
  inited = 0;
  loadingcam = 0;
  time = 0;
  slouching = 0;
  
  document.body.classList.remove("inited");
  document.body.classList.remove("loading");
  
  startButton.classList.remove("hidden");
  stopButton.classList.add("hidden");
  
  timerContainer = document.getElementById("timer");
  timerContainer.innerHTML = time + " secs";
  
  //postureDisplay.innerHTML = "Posture Detection";
  labelContainer.style.backgroundColor = 'transparent';
  labelContainer.classList.add("hidden");
  slouchContainer.classList.remove("slouching");
  document.body.classList.remove("slouching");
  document.body.classList.remove("inited");
  
  emojiOverlay.classList.remove("fa-laugh");
  emojiOverlay.classList.remove("fa-laugh-beam");
  emojiOverlay.classList.add("fa-smile-beam");
  
  document.getElementById("start-button").disabled = false;
  

  
  
  
  
}




async function loop(timestamp) {
  if (inited >= 1) {
    
    webcam.update(); // update the webcam frame
    await predict();
    //window.requestAnimationFrame(loop);
    setTimeout(loop, 20); // fixed 20ms delay
    
  }
}

async function predict() {
  
  if (inited >= 1) {
    
    // Prediction #1: run input through posenet
    // estimatePose can take in an image, video or canvas html element
    const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
    // Prediction 2: run input through teachable machine classification model
    const prediction = await model.predict(posenetOutput);

    for (let i = 0; i < maxPredictions; i++) {
      const classPrediction =
            prediction[i].className + ": " + prediction[i].probability.toFixed(3);
      
      //labelContainer.childNodes[i].innerHTML = classPrediction;

      //if (i == 1) {
      //labelContainer.childNodes[i].style.backgroundColor = 'RED';
      //}

      if (i == 1) {
        if (prediction[i].probability.toFixed(3) >= 0.96) {


          //play sound on first slouch
          if (slouchContainer.classList.contains('slouching') == false) {

            //playSound();
            time = 0; //reset timer

          }


          postureDisplay.innerHTML = "BAD"
          labelContainer.innerHTML = "BAD<span class='tip'>Sit up straight!</span>"
          labelContainer.style.backgroundColor = 'hsl(1 100% 65%)';
          slouchContainer.classList.add("slouching");
          document.body.classList.add("slouching");
          slouching = 1;

          //alert("FIX YOUR POSTURE!!");
        } else {

          postureDisplay.innerHTML = "GOOD"
          labelContainer.innerHTML = "GOOD"
          labelContainer.style.backgroundColor = 'hsl(137.65deg 71.58% 62.75%)';
          slouchContainer.classList.remove("slouching");
          document.body.classList.remove("slouching");
          slouching = 0;

        }
      }

      //prediction[i].probability.toFixed(3)

    }


    // finally draw the poses
    drawPose(pose);
    
  }
  
}

function drawPose(pose) {
  
  if (inited >= 1) {
  
    if (webcam.canvas) {
      ctx.drawImage(webcam.canvas, 0, 0);
      // draw the keypoints and skeleton
      if (pose) {
        const minPartConfidence = 0.1;
        //tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx, keypointSize: 8);
        tmPose.drawKeypoints(
          pose.keypoints, //Keypoint[]
          minPartConfidence, 
          ctx, 
          10, //point size
          'rgba(255,255,255,0.2)', //fill
          'transparent', //stroke
          1 //scale
        );

        /*tmPose.drawKeypoints(
                      pose.keypoints, //Keypoint[]
                      minPartConfidence, 
                      ctx, 
                      3, //point size
                      'red', //fill
                      'aqua', //stroke
                      1 //scale
                  );*/


        //tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);

        tmPose.drawSkeleton(
          pose.keypoints, 
          minPartConfidence, 
          ctx, 
          6, 
          'rgba(255,255,255,0.2)', 
          1
        );



      }
    }
    
  }
    
}



//////////

var audioMuted = 0;
var audioChoice = 1;


var mutecheckbox = document.getElementById("mute-checkbox");

function checkMute() {
  
  if (mutecheckbox.checked == true) {
    audioMuted = 1;
    //document.body.style.backgroundColor = 'blue';
  } else {
    audioMuted = 0;
    //document.body.style.backgroundColor = 'red';
  }

}

mutecheckbox.onchange = checkMute;
//checkMute();



function setAudio(audiopick) {
  
  //set audio to value given
  audioChoice = audiopick;
  
  //then play test sound
  playSound();
  
}




var audio1 = new Audio('https://assets.codepen.io/10272627/72127__kizilsungur__sweetalertsound3.wav');

var audio2 = new Audio('https://assets.codepen.io/10272627/72129__kizilsungur__sweetalertsound5.wav');

var audio3 = new Audio('https://assets.codepen.io/10272627/72128__kizilsungur__sweetalertsound4.wav');

var audio4 = new Audio('https://www.orangefreesounds.com/wp-content/uploads/2021/01/Vine-boom-sound-effect.mp3');

  //https://assets.codepen.io/10272627/72129__kizilsungur__sweetalertsound5.wav
  //https://assets.codepen.io/10272627/72128__kizilsungur__sweetalertsound4.wav
  //https://assets.codepen.io/10272627/72127__kizilsungur__sweetalertsound3.wav


function playSound() {
  //var audio = new Audio('https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3');
  
  //var audio = new Audio('https://www.orangefreesounds.com/wp-content/uploads/2021/01/Vine-boom-sound-effect.mp3');
  
  if (audioMuted == 0) {
  
    if (audioChoice == 1) {
      audio1.play();
    } else if (audioChoice == 2) {
      audio2.play();
    } else if (audioChoice == 3) {
      audio3.play();
    } else if (audioChoice == 4) {
      audio4.play();
    }
    
  }
  
  
}

//


var darkmode = 0;
var darkmodecheckbox = document.getElementById("darkmode-checkbox");

function checkDarkmode() {
  
  if (darkmodecheckbox.checked == true) {
    darkmode = 1;
    document.body.classList.add("darkmode");
    //document.body.style.backgroundColor = 'blue';
  } else {
    darkmode = 0;
    document.body.classList.remove("darkmode");
    //document.body.style.backgroundColor = 'red';
  }

}

darkmodecheckbox.onchange = checkDarkmode;



////////





  
window.setInterval(function () {
  
  if (inited >= 1) {
    
    if (slouching <= 0) {
  
      //increment timer
      time++;
      timerContainer = document.getElementById("timer");
      timerContainer.innerHTML = time + " secs";

      //set new best if time exceeds current best
      if (BestTime < time) {
        BestTime = time;

        BesttimerContainer = document.getElementById("best-timer");
        BesttimerContainer.innerHTML = time + " secs";

      }
      
    }
    
    //play alert sound every second if slouching
    if (slouching >= 1) {
      playSound();
    }
      
    
    
  }
  
}, 1000);

//





//////////


  //////
  
/*
     var i=0;
  function timedCount(){
    i=i+1;postMessage(i);setTimeout("timedCount()",500);
  }
  timedCount();
  */

  /////////



////////////////

/*
var w;


function startWorker() {
        var blob = new Blob([document.querySelector('#worker1').textContent]);
        w =  new Worker(window.URL.createObjectURL(blob));
        w.onmessage = function(event) {
            document.getElementById("result").innerHTML = event.data;
        };
}
*/

/* original code */
/*
function startWorker() {
    if(typeof(Worker) !== "undefined") {
        if(typeof(w) == "undefined") {
            w = new Worker("https://assets.codepen.io/10272627/demo_workers.js");
        }
        w.onmessage = function(event) {
            document.getElementById("result").innerHTML = event.data;
        };
    } else {
        document.getElementById("result").innerHTML = "Sorry, your browser does not support Web Workers...";
    }
}*/

/*
function stopWorker() { 
    w.terminate();
    w = undefined;
}
*/








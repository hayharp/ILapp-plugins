/**
 * jspsych-order
 * Nikolas McNeal & Nathan Hay
 *
 * Plugin for visual ordering of audio stimuli
 *
 **/

jsPsych.plugins["order"] = (function () {
  var plugin = {};

  jsPsych.pluginAPI.registerPreload("order", "stimulus_audio", "audio");
  jsPsych.pluginAPI.registerPreload("order", "stimulus_img", "image");

  plugin.info = {
    name: "order",
    description: "",
    parameters: {
      stimulus_img: {
        type: jsPsych.plugins.parameterType.IMAGE,
        pretty_name: "Stimulus Image",
        default: undefined,
        array: true,
        description: "The image to be displayed",
      },
      stimulus_audio: {
        type: jsPsych.plugins.parameterType.IMAGE,
        pretty_name: "Stimulus Audio",
        default: undefined,
        array: true,
        description: "The audio to be image-linked",
      },
      stimulus_height: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Image height",
        default: null,
        description: "Set the image height in pixels",
      },
      stimulus_width: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Image width",
        default: null,
        description: "Set the image width in pixels",
      },
      maintain_aspect_ratio: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: "Maintain aspect ratio",
        default: true,
        description: "Maintain the aspect ratio after setting width or height",
      },
      choices: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: "Choices",
        default: undefined,
        array: true,
        description: "The labels for the buttons.",
      },
      button_label: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: "Button label",
        default: "Continue",
        description:
          "The text that appears on the button to continue to the next trial.",
      },
      prompt: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: "Prompt",
        default: null,
        description: "Any content here will be displayed under the button.",
      },
      stimulus_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Stimulus duration",
        default: null,
        description: "How long to hide the stimulus.",
      },
      trial_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Trial duration",
        default: null,
        description: "How long to show the trial.",
      },
      margin_vertical: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: "Margin vertical",
        default: "0px",
        description: "The vertical margin of the button.",
      },
      margin_horizontal: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: "Margin horizontal",
        default: "8px",
        description: "The horizontal margin of the button.",
      },
      response_ends_trial: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: "Response ends trial",
        default: true,
        description: "If true, then trial will end when user responds.",
      },
      render_on_canvas: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: "Render on canvas",
        default: true,
        description:
          "If true, the image will be drawn onto a canvas element (prevents blank screen between consecutive images in some browsers)." +
          "If false, the image will be shown via an img element.",
      },
    },
  };

  function startDrag(e) {
    if (!e) {
      var e = window.event;
    }
    if (e.preventDefault) e.preventDefault();

    targ = e.target ? e.target : e.srcElement;

    if (targ.className != "dragme") {
      return;
    }
    offsetX = e.clientX;
    offsetY = e.clientY;

    if (!targ.style.left) {
      targ.style.left = "0px";
    }
    if (!targ.style.top) {
      targ.style.top = "0px";
    }

    coordX = parseInt(targ.style.left);
    coordY = parseInt(targ.style.top);
    drag = true;

    document.onmousemove = dragDiv;
    return false;
  }
  function dragDiv(e) {
    if (!drag) {
      return;
    }
    if (!e) {
      var e = window.event;
    }
    targ.style.left = coordX + e.clientX - offsetX + "px";
    targ.style.top = coordY + e.clientY - offsetY + "px";
    return false;
  }
  function stopDrag() {
    drag = false;
  }
  window.onload = function () {
    document.onmousedown = startDrag;
    document.onmouseup = stopDrag;
  };

  plugin.trial = function (display_element, trial) {
    var html = "";
    var stimulus_items = trial.stimulus_img.length;
    let moves = []
    let sort = []
    
    //Adds images and linked audio. Also primes the moves and sort arrays, and adds the gray marker boxes
    for (let i = 0; i < stimulus_items; i++) {
      html += `<img id="jspsych-order-stimulus-${i+1}" src="${trial.stimulus_img[i]}" class="dragme" data-state="play" style="width: 165px; height: 165px" >`;
      html += `<audio id="jspsych-audio-stimulus-${i+1}" src="${trial.stimulus_audio[i]}" preload="auto"> Your browser does not support the <code>audio</code> tag </audio>`;
      html += `<div id="div1" style="z-index: -1; position: fixed; left: ${250 + (300*i)}px;
               bottom: 300px; width:150px; height: 150px; border: 12px solid #000; background-color: lightgray;"></div>`;
      moves[i] = [];
      sort[i] = [];
    }

    //Adds the submission button
    html +=
      '<div><button id="jspsych-free-sort-done-btn" class="jspsych-btn" ' +
      'style="margin-left: -45px; margin-bottom: -400px; visibility: visible;">' +
      trial.button_label +
      "</button></div>";

    const button = display_element.querySelector("#jspsych-free-sort-done-btn");

    // add prompt
    if (trial.prompt !== null) {
      html += trial.prompt;
    }
    // update the page content
    display_element.innerHTML = html;

    //Initialize audio context items
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    var audio_context = new AudioContext();
    const gainNode = audio_context.createGain();

    var tracks = []

    //Add play function to each element
    for (let i = 0; i < stimulus_items; i++){
      let order_selection = document.getElementById(`jspsych-order-stimulus-${i+1}`)
      sort[i].push(order_selection.getBoundingClientRect().left)
      tracks[i] = audio_context.createMediaElementSource(document.getElementById(`jspsych-audio-stimulus-${i+1}`))
      tracks[i].connect(gainNode).connect(audio_context.destination)
      order_selection.addEventListener("click", function (d) {
        var state = d.currentTarget.dataset.state;
        d.currentTarget.dataset.state = "play";
        if (state == "play") {
          tracks[i]['mediaElement'].currentTime = 0;
          tracks[i]['mediaElement'].play();
          d.currentTarget.dataset.state = "pause";
        } else {
          tracks[i]['mediaElement'].pause()
          tracks[i]['mediaElement'].currentTime = 0;
          gainNode.gain.setValueAtTime(1, audio_context.currentTime, 0.3)
          tracks[i]['mediaElement'].play()
        }
        sort[i].push(order_selection.getBoundingClientRect().left);
        moves[i].push(order_selection.style.left);
      });
    }

    //Function to stop other audio clips when a new one is clicked
    function stopAllAudio() {
      tracks.forEach(function (audio) {
        audio['mediaElement'].pause();
        audio['mediaElement'].currentTime = 0;
      });
    }

    //Add stop function to all elements
    var audio_select_list = [];
    for (let i = 0; i < stimulus_items; i++) {
      selected = document.querySelector(`#jspsych-order-stimulus-${i+1}`);
      audio_select_list[i] = selected;
      selected.addEventListener("mousedown", function () {
        stopAllAudio();
      });
    }

    // store response
    var response = {
      rt: null,
      button: null,
    };

    var trial_data;

    // function to end trial when it is time
    function end_trial() {
      // kill any remaining setTimeout handlers
      response.button = parseInt(choice);
      jsPsych.pluginAPI.clearAllTimeouts();

      // gather the data to store for the trial
    }

    //Finish the trial when submission button is clicked
    display_element
      .querySelector("#jspsych-free-sort-done-btn")
      .addEventListener("click", function () {
        display_element.innerHTML = "";
        trial_data = {
          visual_presentation: trial.stimulus_audio,
          sort: sort.map(function(x) {
            return x.pop()
          }),
          moves: sort.map(function(x) {
            return x.pop()
          })
        };
        jsPsych.finishTrial(trial_data);
      });

    // end trial if time limit is set
    if (trial.trial_duration !== null) {
      jsPsych.pluginAPI.setTimeout(function () {
        end_trial();
      }, trial.trial_duration);
    } else if (trial.response_ends_trial === false) {
      console.warn(
        "The experiment may be deadlocked. Try setting a trial duration or set response_ends_trial to true."
      );
    }
  };

  return plugin;
})();

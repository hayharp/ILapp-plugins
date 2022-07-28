/*
 * midi-variable-slider
 * Nathan Hay
 * Uses tone.js to play a synth input. A slider controls any given property of Transport
 */

jsPsych.plugins['midi-variable-slider'] = (function() {

  var plugin = {};

  plugin.info = {
    name: 'midi-variable-slider',
    description: 'Uses tone.js to play a synth input. A slider controls any given property of Tone.Transport',
    parameters: {
      stimulus: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Synth Sequence',
        default: undefined,
        array: true,
        description: 'Input synth array'
      },
      button_label: {
        type: jsPsych.plugins.parameterType.STRING,
        default: 'Submit',
        description: 'Button label to submit slider position'
      },
      transport_variable: {
        type: jsPsych.plugins.parameterType.STRING,
        default: 'bpm',
        description: 'The transport property to be changed'
      },
      midi_synth: {
        type: jsPsych.plugins.parameterType.FUNCTION,
        default: 'membrane',
        description: 'The synth type to use'
      },
      tv_target: {
        type: jsPsych.plugins.parameterType.INT,
        default: 2,
        description: 'The target transport variable value'
      },
      tv_randomize: {
        type: jsPsych.plugins.parameterType.BOOL,
        default: true,
        description: 'Whether or not to randomize the starting value for transport variable'
      },
      outlier_boundary: {
        type: jsPsych.plugins.parameterType.INT,
        default: undefined,
        description: 'Allowed tollerance before results are marked as outliers'
      },
      slider_range_upper: {
        type: jsPsych.plugins.parameterType.INT,
        default: undefined,
        description: 'The upper limit for slider range'
      },
      slider_range_lower: {
        type: jsPsych.plugins.parameterType.INT,
        default: undefined,
        description: 'The lower limit for slider range'
      },
      slider_randomized: {
        type: jsPsych.plugins.parameterType.BOOL,
        defaults: true,
        description: 'Whether or not to randomize slider boundaries'
      },
      slider_range_minimum: {
        type: jsPsych.plugins.parameterType.INT,
        default: 50,
        description: 'The minimum range for the slider'
      },
      ref_tempo: {
        type: jsPsych.plugins.parameterType.INT,
        description: 'Midi composition reference tempo',
        default: 120
      },
      iteration_tag: {
        type: jsPsych.plugins.parameterType.INT,
        description: 'Number of times stimulus has been iterated',
        default: undefined
      },
      message: {
        type: jsPsych.plugins.parameterType.STRING,
        default: null,
      }
    },
  };

  plugin.trial = function(display_element, trial) {
    // Determine start value for slider
    if (trial.tv_randomize) {
      var slider_start = Math.ceil(Math.random() * (trial.slider_range_upper - trial.slider_range_lower) + trial.slider_range_lower)
    } else {
      var slider_start = trial.slider_range_lower
    }

    // Randomize the actual used upper and lower bounds. Makes sure there is a minimum range.
    if (trial.slider_randomized) {
      var slider_upper = 1
      var slider_lower = 1
      while (trial.tv_target > slider_upper || trial.tv_target < slider_lower || slider_upper - slider_lower < trial.slider_range_minimum) {
        slider_upper = Math.ceil(Math.random() * (trial.slider_range_upper - slider_start) + slider_start)
        slider_lower = Math.ceil(Math.random() * (slider_start - trial.slider_range_lower) + trial.slider_range_lower)
      }
    } else {
      var slider_upper = trial.slider_range_upper
      var slider_lower = trial.slider_range_lower
    }

    // Add the slider
    var html = '<div class="slidecontainer">' +
               `  <input type="range" min="${slider_lower}" max="${slider_upper}" value="${slider_start}" class="slider" id="tvrange">` +
               '</div>';

    // Add the submission button
    html += '<div>' +
            ` <button id="jspsych-midi-variable-slider-submit" class="jspsych-btn" style="margin-top: 20%;">${trial.button_label}</button>` +
            '</div>';

    if (trial.message !== null) {
      html += trial.message
    }

    // Update html
    display_element.innerHTML = html;

    // Get the correct tv element and synth

    switch (trial.transport_variable) {
      case 'bpm': 
        var tv = Tone.Transport.bpm
        break;
      case 'swing':
        var tv = Tone.Transport.swing
        break;
    };

    switch (trial.midi_synth) {
      case 'membrane':
        var synth = new Tone.MembraneSynth().toDestination();
        synth.volume.value = -2;
        break;
      case 'pluck':
        var synth = new Tone.PluckSynth().toDestination();
        break;
      case 'mono':
        var synth = new Tone.MonoSynth().toDestination();
        break;
    }

    // Start the audio loop

    //tv.value = 100
    Tone.Transport.bpm.value = trial.ref_tempo

    var stimulus_repeat = new Tone.Part(function(time, note) {
      synth.triggerAttackRelease(note, '16n', time)
    }, trial.stimulus)
    Tone.start()
    stimulus_repeat.loop = true
    //stimulus_repeat.loopEnd = trial.stimulus.at(-1)[0] + 1
    stimulus_repeat.loopEnd = trial.stimulus[trial.stimulus.length - 1][0] + 1
    tv.value = slider_start
    Tone.Transport.start()
    stimulus_repeat.start()

    // Update tv value with slider
    slider = document.getElementById("tvrange")
    slider.oninput = function() {
      tv.value = this.value
    }

    // data saving
    var trial_data; 

    // end trial

    display_element.querySelector("#jspsych-midi-variable-slider-submit").addEventListener("click", function() {
      display_element.innerHTML = '';
      trial_data = {
        slider_value: tv.value,
        slider_starting_position: slider_start,
        slider_upper_bound: slider_upper,
        slider_lower_bound: slider_lower,
        midi: trial.stimulus
      }
      if (trial.outlier_boundary) { // If there is an outlier boundary set, see if the slider value is an outlier
        if ((Math.abs(tv.value - trial.tv_target) / trial.tv_target) > trial.outlier_boundary) {
          trial_data['outlier'] = true
          var is_outlier = true
        } else {
          trial_data['outlier'] = false
        }
      }
      if (trial.iteration_tag) { // If the data is an outlier, and there are iteration tags, don't iterate it
        if (is_outlier == true) {
          trial_data['iteration_tag'] = trial.iteration_tag
          trial_data['slider_value'] = trial.tv_target
          trial_data['outlier_value'] = Math.round(tv.value)
        } else {
          trial_data['iteration_tag'] = trial.iteration_tag + 1
        }
      }
      Tone.Transport.stop()
      Tone.Transport.cancel(stimulus_repeat)
      stimulus_repeat.dispose()
      synth.dispose()
      jsPsych.finishTrial(trial_data);
    })

  };

  return plugin;
})();

/*
 * midi-play
 * Nathan Hay
 * Uses tone.js to play a midi stimulus
*/

jsPsych.plugins['midi-play'] = (function() {

  var plugin = {};
  
  plugin.info = {
    name: 'midi-play',
    description: 'Uses tone.js to play a midi stimulus',
    parameters: {
      stimulus: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Midi Sequence',
        default: undefined,
        array: true,
        description: 'Input midi array'
      },
      iterations: {
          type: jsPsych.plugins.parameterType.INT,
          pretty_name: 'Loop Length',
          default: 0,
          description: 'Times to loop midi array'
      },
      message: {
         type: jsPsych.plugins.parameterType.STR,
         default: null
      },
      tempo: {
        type: jsPsych.plugins.parameterType.INT,
        description: 'Midi tempo in BPM',
        default: 100
      },
      ref_tempo: {
        type: jsPsych.plugins.parameterType.INT,
        description: 'Midi composition reference tempo',
        default: 120
      },
      midi_synth: {
        type: jsPsych.plugins.parameterType.STR,
        default: 'membrane',
        description: 'The synth type to use'
      }
    },
  };
  
  plugin.trial = function(display_element, trial) {
    // Start the audio loop

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
  
    Tone.Transport.bpm.value = trial.ref_tempo
  
    var midi_play = new Tone.Part(function(time, note) {
      synth.triggerAttackRelease(note, '16n', time)
    }, trial.stimulus)
    Tone.start()
    midi_play.loop = trial.iterations
    midi_play.loopEnd = trial.stimulus[trial.stimulus.length - 1][0] + 1
    Tone.Transport.bpm.value = trial.tempo
    Tone.Transport.start()
    midi_play.start()
  
    // html
    if (trial.message !== null) {
      html = trial.message;
      display_element.innerHTML = html;
    }

    // data saving
    var trial_data; 

    trial_length = midi_play.loopEnd * trial.iterations
  
    // end trial
    var end_trial = function() {
        jsPsych.pluginAPI.clearAllTimeouts();
        Tone.Transport.stop();
        Tone.Transport.cancel(midi_play)
        midi_play.dispose();
        synth.dispose()
        jsPsych.finishTrial(trial_data);
      };

    jsPsych.pluginAPI.setTimeout(function() {
        end_trial();
    }, trial_length*1000)
  };
  
  return plugin;
})();
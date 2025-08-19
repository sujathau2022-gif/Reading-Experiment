// In this file, we define the sequence of views in the experiment 

const views_seq = [
    // Intro view
    intro = magpieViews.view_generator("intro", {
        trials: 1,
        name: 'intro',
        text: `Welcome to the Reading Comprehension Experiment.
               You will first provide some demographic details,
               then read 4 passages. Each passage will appear blurred,
               and as you move your mouse, words will be revealed.
               After reading each passage, you will answer 3 True/False questions.`,
        buttonText: "Begin"
    }),

    // Custom comprehension with demographics first
    {
        name: 'main_experiment',
        render: function(CT, magpie) {
            // Call the custom start function (which shows demographics first)
            vocabulary_mouse_tracking_function({
                trials: trial_info.vocabulary_mouse_tracking,
                name: 'main_experiment'
            }).start(magpie);
        }
    },

    // End screen
    thanks = magpieViews.view_generator("thanks", {
        trials: 1,
        name: 'thanks',
        title: "Thank you!",
        text: "Your responses have been recorded."
    })
];

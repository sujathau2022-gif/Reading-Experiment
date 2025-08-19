// In this file you initialize and configure your experiment using magpieInit

$("document").ready(function() {
    // prevent scrolling when space is pressed
    window.addEventListener('keydown', function(e) {
        if (e.keyCode === 32 && e.target === document.body) {
            e.preventDefault();
        }
    });

    // calls magpieInit
    // in debug mode this returns the magpie-object, which you can access in the console
    window.magpie_monitor = magpieInit({
        // 👇 use the views_seq defined in 05_views.js
        views_seq: views_seq,

        deploy: {
            experimentID: "INSERT_A_NUMBER",
            serverAppURL: "https://magpie-demo.herokuapp.com/api/submit_experiment/",
            // Possible deployment methods are:
            // "debug" and "directLink"
            // As well as "MTurk", "MTurkSandbox" and "Prolific"
            deployMethod: "debug",
            contact_email: "YOUREMAIL@wherelifeisgreat.you",
            prolificURL: "https://app.prolific.co/submissions/complete?cc=SAMPLE1234"
        },

        progress_bar: {
            in: [
                "main_experiment"   // 👈 use the name we gave in 05_views.js
            ],
            style: "default",
            width: 100
        }
    });
});

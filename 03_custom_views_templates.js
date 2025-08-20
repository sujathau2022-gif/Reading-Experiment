// Custom mouse tracking view with spotlight blur + demographics + CSV + Google Sheet submission 
const vocabulary_mouse_tracking_function = function(config) {
    const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbzZ6jUnPqkxA-VZP7gz-yOP4DSCMlgqieIatMesnzUZiURPj36SMYUrddMCV1BllFcMvA/exec";

    const view = {
        name: config.name,
        CT: 0,
        trials: config.trials,
        allMouseData: [],
        totalScore: 0,
        demographics: {},

        // 🔹 Step 1: Instructions + Demographics
        start: function(magpie) {
            $('#main').html(`
                <div class='magpie-view'>
                    <h1>Instructions</h1>
                    <p>Please read each passage carefully. After reading, answer 3 True/False questions.</p>
                    <h2>Participant Information</h2>
                    <label>Name: <input type="text" id="name"></label><br><br>
                    <label>Gender: 
                        <select id="gender">
                            <option value="">--Select--</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </label><br><br>
                    <label>Designation:
                        <select id="designation">
                            <option value="">--Select--</option>
                            <option value="Student">Student</option>
                            <option value="Researcher">Researcher</option>
                        </select>
                    </label><br><br>
                    <label>Department: <input type="text" id="department"></label><br><br>
                    <label>Comments: <textarea id="comments"></textarea></label><br><br>
                    <button id="start-experiment">Start Experiment</button>
                </div>
            `);

            $('#start-experiment').on('click', () => {
                this.demographics = {
                    name: $('#name').val(),
                    gender: $('#gender').val(),
                    designation: $('#designation').val(),
                    department: $('#department').val(),
                    comments: $('#comments').val()
                };
                this.render(this.CT, magpie);
            });
        },

        // 🔹 Step 2: Show passage with spotlight blur
        render: function(CT, magpie) {
            const trial = config.trials[CT];
            let passageLog = [];

            $('#main').html(`
                <div class='magpie-view'>
                    <h1>Reading Comprehension with Mouse Tracking</h1>
                    <h2>${trial.title}</h2>
                    <canvas id="reading-canvas" width="800" height="400" style="border:1px solid #ccc;"></canvas>
                    <p><button id="finish-reading">I have finished reading</button></p>
                </div>
            `);

            const canvas = document.getElementById("reading-canvas");
            const ctx = canvas.getContext("2d");
            ctx.font = "18px Arial";
            ctx.textBaseline = "top";

            const words = trial.passage.split(" ");
            const lineHeight = 24;
            const margin = 20;
            const maxWidth = 760;

            let lines = [];
            let currentLine = words[0];
            for (let i = 1; i < words.length; i++) {
                const testLine = currentLine + " " + words[i];
                if (ctx.measureText(testLine).width < maxWidth) {
                    currentLine = testLine;
                } else {
                    lines.push(currentLine);
                    currentLine = words[i];
                }
            }
            lines.push(currentLine);

            let wordPositions = [];
            let y = margin;
            for (let line of lines) {
                let x = margin;
                for (let word of line.split(" ")) {
                    let width = ctx.measureText(word).width;
                    wordPositions.push({ word, x, y, width, top: y, left: x, bottom: y + lineHeight, right: x + width });
                    x += width + ctx.measureText(" ").width;
                }
                y += lineHeight;
            }

            function drawBlur(mouseX, mouseY) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = "rgba(0,0,0,0.6)";
                for (let wp of wordPositions) {
                    ctx.save();
                    ctx.filter = "blur(3px)";
                    ctx.fillText(wp.word, wp.x, wp.y);
                    ctx.restore();
                }

                for (let wp of wordPositions) {
                    if (mouseX >= wp.x && mouseX <= wp.x + wp.width && mouseY >= wp.y && mouseY <= wp.y + lineHeight) {
                        ctx.fillStyle = "black";
                        ctx.fillText(wp.word, wp.x, wp.y);
                    }
                }
            }

            drawBlur(-100, -100);
            const startTime = Date.now();

            canvas.addEventListener("mousemove", (e) => {
                const rect = canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                let insideWord = "";
                let wordPos = {};
                for (let wp of wordPositions) {
                    if (mouseX >= wp.x && mouseX <= wp.x + wp.width && mouseY >= wp.y && mouseY <= wp.y + lineHeight) {
                        insideWord = wp.word;
                        wordPos = { top: wp.top, left: wp.left, bottom: wp.bottom, right: wp.right };
                        break;
                    }
                }
                passageLog.push({
                    time: Date.now() - startTime,
                    x: mouseX,
                    y: mouseY,
                    word: insideWord,
                    wordPos: wordPos,
                    itemId: trial.id
                });
                drawBlur(mouseX, mouseY);
            });

            $('#finish-reading').on('click', () => {
                this.allMouseData.push(...passageLog);
                this.showQuestions(trial, magpie);
            });
        },

        // 🔹 Step 3: Questions
        showQuestions: function(trial, magpie) {
            let questionIndex = 0;
            let score = 0;
            const total = trial.questions.length;

            const renderQuestion = () => {
                if (questionIndex < total) {
                    $('#main').html(`
                        <div class='magpie-view'>
                            <h2>${trial.title}</h2>
                            <p><b>Question ${questionIndex + 1} of ${total}</b></p>
                            <p>${trial.questions[questionIndex].question}</p>
                            <button class="answer-btn" data-answer="True">TRUE</button>
                            <button class="answer-btn" data-answer="False">FALSE</button>
                        </div>
                    `);

                    $('.answer-btn').on('click', (e) => {
                        const ans = $(e.target).data('answer');
                        if (ans === trial.questions[questionIndex].correct) {
                            score++;
                        }
                        questionIndex++;
                        renderQuestion();
                    });

                } else {
                    this.totalScore += score;
                    this.CT++;
                    if (this.CT < this.trials.length) {
                        this.render(this.CT, magpie);
                    } else {
                        this.showFinalResults();
                    }
                }
            };
            renderQuestion();
        },

        // 🔹 Step 4: Final results CSV + Google Sheet
        showFinalResults: function() {
            let csv = "Name,Gender,Designation,Department,Comments,responseTime,ItemId,Index,mouseX,mouseY,Word,wordTop,wordLeft,wordBottom,wordRight,Score\n";
            this.allMouseData.forEach((entry, i) => {
                csv += `"${this.demographics.name}","${this.demographics.gender}","${this.demographics.designation}","${this.demographics.department}","${this.demographics.comments}",${entry.time},${entry.itemId},${i},${entry.x},${entry.y},"${entry.word || ""}",${entry.wordPos.top || ""},${entry.wordPos.left || ""},${entry.wordPos.bottom || ""},${entry.wordPos.right || ""},${this.totalScore}\n`;
            });

            // Download CSV locally
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);

            $('#main').html(`
                <div class='magpie-view'>
                    <h2>Final Results</h2>
                    <p><b>Total Score:</b> ${this.totalScore} out of ${this.trials.length * 3}</p>
                    <a id="download" href="${url}" download="results.csv">Download Results (CSV)</a>
                    <p>Results are also being sent to Google Sheet...</p>
                </div>
            `);

            // ✅ FIXED: send as FormData (not raw CSV)
            const formData = new FormData();
            formData.append("csv", csv);

            fetch(GOOGLE_SHEET_URL, {
                method: "POST",
                mode: "no-cors",
                body: formData
            }).then(() => console.log("Results sent to Google Sheet"))
              .catch(err => console.error("Error sending to Google Sheet:", err));
        }
    };

    return view;
};

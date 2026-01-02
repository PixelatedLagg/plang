//https://stackoverflow.com/a/2450976
function shuffle(array) {
    let currentIndex = array.length;
    while (currentIndex != 0) {
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
}

/*
position:
    writeIndex : index
    writesLeft : number
    sessions : array<string>
    sessionIndex : index
    writesForRound : number
    goalForRound : number
    roundsDone : number
    colorIndex : index
*/

let positionText = document.getElementById("position-text");

function playAudio(id) {
    for (var child of player.children) {
        if (child.getAttribute("data-index") == id) {
            child.play();
            return;
        }
    }
}

function updatePosition(p, challenge = false) {
    console.log("UPDATE POSITION");
    console.log(p);
    var msg = "rounds left: " + (averageSessions - p.roundsDone) + "; sessions left: " + (p.sessions.length - p.sessionIndex) + "; writes left: " + p.writesLeft;
    positionText.innerHTML = msg;

    if (!challenge) {
        positionText.innerHTML += "<br>current term: " + p.sessions[p.sessionIndex].value;
    }
}

function audioHanziDone() {
    console.log("audio hanzi done!!!");
}

function nextRound(position) {
    position.roundsDone++;
    position.writesForRound -= termSlope;
    position.goalForRound -= timeSlope;

    console.log("next round!");
    console.log(position);
    if (averageSessions === position.roundsDone) {
        //all rounds done
        audioHanziDone();
    }
    else {
        //start next round
        position.sessionIndex = 0;
        shuffle(position.sessions);
        nextSession(position);
    }
}

function changeWriteColor(position) {
    console.log("change write color!");
    var color = ["#000", "#2a9d8f", "#e4ad22", "#588157", "#d62828", "#f15bb5", "#003f88"];
    var newColorIndex = 0;
    while (newColorIndex === position.colorIndex) {
        newColorIndex = Math.floor(Math.random() * color.length);
    }
    position.colorIndex = newColorIndex;
    position.writer.updateColor("strokeColor", color[newColorIndex]);
    position.demonstration.updateColor("strokeColor", color[newColorIndex]);
    console.log(position);
}

function nextSession(position) {
    position.sessionIndex++;
    console.log("next session!");
    console.log(position);
    if (position.sessions.length === position.sessionIndex) {
        //done with round of sessions
        nextRound(position);
    }
    else {
        //start new session
        position.writesLeft = position.writesForRound;
        updatePosition(position);
        position.writesLeft++;
        nextWrite(position);
    }
}

let audioHanziContainer = document.getElementById("main-area");
let challengeContainer = document.getElementById("challenge-area");
let challengeCountdown = document.getElementById("challenge-countdown");

function startCountdown(done) {
    return new Promise((resolve) => {
        countdown(done);
        function countdown(done) {
            if (done.status) {
                //user passed the challenge
                resolve(true);
                return;
            }
            challengeCountdown.innerHTML = "time left: " + (done.ms / 1000.0);
            done.ms -= 100;
            if (done.ms === 0) {
                resolve(false);
                return;
            }
            setTimeout(() => {
                //updates every tenth of a second
                countdown(done);
            }, 100)
        }
    });
}

//https://stackoverflow.com/a/2712158
function setRecursiveHidden(element, hidden) {
    for (var i = 0; i < element.childNodes.length; i++) {
        var child = element.childNodes[i];
        setRecursiveHidden(child, hidden);
        child.hidden = hidden;
    }
    element.hidden = hidden;
}

function nextChallenge(position) {
    setRecursiveHidden(audioHanziContainer, true);
    setRecursiveHidden(challengeContainer, false);
    updatePosition(position, true);
    console.log("challenge!");
    console.log(position);

    playAudio(position.sessions[position.sessionIndex].id);
    position.writeIndex = 0;
    challengeChar(position);
}

function challengeChar(position) {
    position.challenge.setCharacter(position.sessions[position.sessionIndex].value.charAt(position.writeIndex));
    let challengeDone = {
        status: false,
        ms: position.goalForRound * 1000
    }

    startCountdown(challengeDone).then((passed) => {
        if (passed) {
            console.log("passed char: " + position.sessions[position.sessionIndex].value.charAt(position.writeIndex));
            position.writeIndex++;
            if (position.sessions[position.sessionIndex].value.length === position.writeIndex) {
                //done with challenge!
                position.writeIndex = 0;
                setRecursiveHidden(audioHanziContainer, false);
                setRecursiveHidden(challengeContainer, true);
                updatePosition(position);
                nextSession(position);
            }
            else {
                //continue to next challenge char
                challengeChar(position);
            }
        }
        else {
            console.log("failed");
            updateMessageWithOffset(position.writesForRound);

            //redo last session
            position.sessionIndex--;
            updatePosition(position);
            nextSession(position);
        }
    });

    position.challenge.quiz({
        onComplete: () => {
            challengeDone.status = true;
        }
    });
}

function nextWrite(position) {
    position.writesLeft--;
    console.log("next write!");
    console.log(position);
    if (position.writesLeft === 0) {
        //done with all writes, move onto challenge!
        nextChallenge(position);
    }
    else {
        updatePosition(position);
        updateMessageWithOffset(-1);

        playAudio(position.sessions[position.sessionIndex].id);
        //start writing term again
        position.writeIndex = 0;
        changeWriteColor(position);
        nextChar(position);
    }
}

let strokeOrder = document.getElementById("stroke-order");
let characterContainer = document.getElementById("character");
let demonstrationContainer = document.getElementById("demonstration");

function nextChar(position) {
    console.log("next char!");
    console.log(position);
    //skip re-rendering if term is one character and the character has alreay been rendered
    if (position.sessions[position.sessionIndex].value.length === 1) {
        if (position.writesLeft === position.writesForRound) {
            position.writer.setCharacter(position.sessions[position.sessionIndex].value.charAt(position.writeIndex));
            position.demonstration.setCharacter(position.sessions[position.sessionIndex].value.charAt(position.writeIndex));
        }
    }
    else {
        position.writer.setCharacter(position.sessions[position.sessionIndex].value.charAt(position.writeIndex));
        position.demonstration.setCharacter(position.sessions[position.sessionIndex].value.charAt(position.writeIndex));
    }

    position.writer.quiz({
        onComplete: () => {
            if (position.sessions[position.sessionIndex].value.length === position.writeIndex + 1) {
                //done with write, move onto next write
                nextWrite(position);
            }
            else {
                //continue write
                position.writeIndex++;
                nextChar(position);
            }
        }
    });
}

let audioHanziEntireContainer = document.getElementById("audio-hanzi");

function audioHanzi() {
    let hanziArray = [];
    for (var i = 0; i < data.terms.length; i++) {
        hanziArray.push({
            value: data.terms[i].hanzi,
            id: i
        });
    }
    console.log(hanziArray);

    let writer = HanziWriter.create("character", hanziArray[0].value.charAt(0), {
        width: 200,
        height: 200,
        showCharacter: false,
        showOutline: false,
        highlightOnComplete: false,
        padding: 5,
        showHintAfterMisses: false,
        strokeFadeDuration: 0,
        strokeColor: "#000"
    });

    var demonstration = HanziWriter.create("demonstration", hanziArray[0].value.charAt(0), {
        width: 200,
        height: 200,
        padding: 5,
        showOutline: false,
        strokeAnimationSpeed: 2,
        delayBetweenStrokes: 10,
        strokeColor: "#000"
    });

    strokeOrder.onclick = () => {
        demonstration.animateCharacter();
    }

    let challenge = HanziWriter.create("challenge", hanziArray[0].value.charAt(0), {
        width: 200,
        height: 200,
        showCharacter: false,
        showOutline: false,
        highlightOnComplete: false,
        padding: 5,
        showHintAfterMisses: false,
        strokeFadeDuration: 0,
        strokeColor: "#000"
    });

    let position = {
        writeIndex: 0,
        writesLeft: startTerms,
        sessions: hanziArray,
        sessionIndex: 0,
        writesForRound: startTerms,
        goalForRound: startTime,
        roundsDone: 0,
        writer: writer,
        demonstration: demonstration,
        colorIndex: 0,
        challenge: challenge
    }

    setRecursiveHidden(audioHanziEntireContainer, false);
    setRecursiveHidden(challengeContainer, true);
    shuffle(hanziArray);
    updatePosition(position);
    
    playAudio(position.sessions[position.sessionIndex].id);
    nextChar(position);
}
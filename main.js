var json = sessionStorage.getItem("plang-file");
var data = JSON.parse(json);
var testValue = data.settings.testValue;

let player = document.getElementById("player");
let termList = document.getElementById("item-list");

var replayAudio = document.getElementById("replay-audio");
var currentAudioElement = null;

replayAudio.onclick = function() {
    if (currentAudioElement) {
        currentAudioElement.play();
    }
}

//create term audio elements
for (var i = 0; i < data.terms.length; i++) {
    var termData = data.terms[i];

    var term = document.createElement("p");
    term.innerText = termData.meaning + " ";
    
    var termSpan = document.createElement("span");
    termSpan.innerText = termData.pinyin + "; " + termData.hanzi;
    term.append(termSpan);

    let audio = document.createElement("audio");
    audio.src = termData.audio;
    audio.setAttribute("data-index", i);
    player.append(audio);

    var termAudio = document.createElement("button");
    termAudio.innerText = "Audio";
    termAudio.onclick = () => {
        audio.play();
        for (var child of termList.children) {
            child.children[1].disabled = true;
        }

        audio.onended = () => {
            for (var child of termList.children) {
                child.children[1].disabled = false;
            }
        }
    }
    term.innerHTML += " ";
    term.append(termAudio);
    termList.append(term);
}

var groupModeSelect = document.getElementById("group-mode");

//populate groups
for (let group of data.groups) {
    groupModeSelect.innerHTML += `<option value="${group.name}">${group.name}</option>`;
}

//parse testValue
//implement later!

//all time is in seconds
let minSessions = 5;
let goal = 3;
let averageTermTime = 3;
let timeSlope = 4;
let termSlope = 1;
let averageSessions = 7;
let startTerms = 10;
//let startTerms = 2;

//derivative calculations
let startTime = goal + (averageSessions * timeSlope);
let endTerms = startTerms - (averageSessions * termSlope);
let estimatedTerms = Math.floor((averageSessions * endTerms) + ((startTerms - endTerms) * averageSessions * 0.5));

let timeMessage = document.getElementById("time-message");

let termsLeft = data.terms.length;
let termsToWriteLeft = estimatedTerms * data.terms.length;


//elements
let formMode = document.getElementById("mode");
let formBegin = document.getElementById("begin");
let positionText = document.getElementById("position-text");
let challengeCountdown = document.getElementById("challenge-countdown");
let modeArea = document.getElementById("mode-area");
let bottomMenu = document.getElementById("bottom-menu");

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

class mode {
    constructor() {
        formBegin.disabled = true;
        formMode.disabled = true;
        console.log(formMode.value);

        let termArray = [];
        switch (formMode.value) {
            case "sentences":
                break;
            //case "groups":
            //    break;
            //case "subgroups":
            //    break;
            default:
                for (var i = 0; i < data.terms.length; i++) {
                    termArray.push({
                        hanzi: data.terms[i].hanzi,
                        pinyin: data.terms[i].pinyin,
                        id: i
                    })
                }
                break;
        }
        
        let position = {
            writeIndex: 0,
            writesLeft: startTerms,
            sessions: termArray,
            sessionIndex: 0,
            writesForRound: startTerms,
            goalForRound: startTime,
            roundsDone: 0,
            colorIndex: 0,
            type: formMode.value,
            root: this
        }

        switch (position.type) {
            case "audio-hanzi":
                position.instance = new audioHanzi();
                break;
            case "audio-pinyin":
                position.instance = new audioPinyin();
                break;
            case "audio-meaning":
                position.instance = new audioMeaning();
                break;
        }

        position.instance.init(position);
    }

    updateMessage() {
        //https://stackoverflow.com/a/25279399
        var date = new Date(0);
        date.setSeconds(termsToWriteLeft * averageTermTime); // specify value for SECONDS here
        var time = date.toISOString().substring(11, 19);
        var msg = "Estimated time: <b>" + time + "</b>; Estimated terms to write: <b>" + termsToWriteLeft + "</b>; Terms left: <b>" + termsLeft + "</b>";
        timeMessage.innerHTML = msg;
    }

    updateMessageWithOffset(offset) {
        termsToWriteLeft += offset;
        this.updateMessage();
    }

    updatePosition(p, challenge=false) {
        console.log("UPDATE POSITION");
        console.log(p);
        var msg = "rounds left: " + (averageSessions - p.roundsDone) + "; sessions left: " + (p.sessions.length - p.sessionIndex) + "; writes left: " + p.writesLeft;
        positionText.innerHTML = msg;

        for (let child of player.children) {
            if (child.getAttribute("data-index") === `${p.sessionIndex}`) {
                currentAudioElement = child;
                break;
            }
        }

        if (!challenge) {
            positionText.innerHTML += "<br>current term: " + p.sessions[p.sessionIndex].hanzi;
        }
    }

    shuffle(array) { //done
        //https://stackoverflow.com/a/2450976
        let currentIndex = array.length;
        while (currentIndex != 0) {
            let randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
    }

    startCountdown(done) { //done
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

    switchArea(area) { //done
        this.setRecursiveHidden(modeArea, true);
        modeArea.hidden = false;
        for (var element of area) {
            this.setRecursiveHidden(element, false);
        }
    }

    setRecursiveHidden(element, hidden) { //done
        //https://stackoverflow.com/a/2712158
        for (var i = 0; i < element.childNodes.length; i++) {
            var child = element.childNodes[i];
            this.setRecursiveHidden(child, hidden);
            child.hidden = hidden;
        }
        element.hidden = hidden;
    }

    changeColor(position) { //done
        console.log("change write color!");
        var color = ["#000", "#2a9d8f", "#e4ad22", "#588157", "#d62828", "#f15bb5", "#003f88"];
        var newColorIndex = 0;
        while (newColorIndex === position.colorIndex) {
            newColorIndex = Math.floor(Math.random() * color.length);
        }
        position.colorIndex = newColorIndex;
        position.instance.changeColor(position, color[newColorIndex]);
        console.log(position);
    }

    //mode methods

    nextRound(position) { //done
        position.roundsDone++;
        position.writesForRound -= termSlope;
        position.goalForRound -= timeSlope;

        console.log("next round!");
        console.log(position);
        if (averageSessions === position.roundsDone) {
            //all rounds done
            position.instance.modeDone();
        }
        else {
            //start next round
            position.sessionIndex = 0;
            this.shuffle(position.sessions);
            this.nextSession(position);
        }
    }

    nextSession(position) { //done
        position.sessionIndex++;
        console.log("next session!");
        console.log(position);
        if (position.sessions.length === position.sessionIndex) {
            //done with round of sessions
            this.nextRound(position);
        }
        else {
            //start new session
            position.writesLeft = position.writesForRound;
            this.updatePosition(position);
            position.writesLeft++;
            this.nextTerm(position);
        }
    }

    nextChallenge(position) { //done
        this.updatePosition(position, true);
        console.log("challenge!");
        console.log(position);

        //start next challenge
        this.switchArea([document.getElementById(position.type + "-challenge"), bottomMenu, positionText, timeMessage]);
        position.instance.nextChallenge(position);
    }

    nextTerm(position) { //done
        position.writesLeft--;
        console.log("next write!");
        console.log(position);
        if (position.writesLeft === 0) {
            //done with all terms, move onto challenge!
            this.nextChallenge(position);
        }
        else {
            this.updatePosition(position);
            this.updateMessageWithOffset(-1);

            //start next term
            this.changeColor(position);
            position.instance.nextTerm(position);
        }
    }
}

formBegin.onclick = () => {
    new mode();
}
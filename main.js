var json = sessionStorage.getItem("plang-file");
var data = JSON.parse(json);
var testValue = data.settings.testValue;

let player = document.getElementById("player");
let termList = document.getElementById("item-list");

//create audio elements
for (var i = 0; i < data.terms.length; i++) {
    var termData = data.terms[i];

    var term = document.createElement("p");
    term.innerText = termData.meaning + " ";
    
    var termSpan = document.createElement("span");
    termSpan.innerText = termData.pinyin + "; " + termData.hanzi;
    term.append(termSpan);

    if (termData.audio !== null) {
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
    }
    termList.append(term);
}

//parse testValue
//implement later!

//all time is in seconds
let minSessions = 5;
let goal = 3;
let averageTermTime = 35;
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

updateMessage();

function updateMessage() {
    //https://stackoverflow.com/a/25279399
    var date = new Date(0);
    date.setSeconds(termsToWriteLeft * averageTermTime); // specify value for SECONDS here
    var time = date.toISOString().substring(11, 19);
    var msg = "Estimated time: <b>" + time + "</b>; Estimated terms to write: <b>" + termsToWriteLeft + "</b>; Terms left: <b>" + termsLeft + "</b>";
    timeMessage.innerHTML = msg;
}

function updateMessageWithOffset(offset) {
    termsToWriteLeft += offset;
    updateMessage();
}

let formMode = document.getElementById("mode");
let formBegin = document.getElementById("begin");

formBegin.onclick = () => {
    formBegin.disabled = true;
    formMode.disabled = true;
    console.log(formMode.value);
    switch (formMode.value) {
        case "audio-hanzi":
            audioHanzi();
            break;
        case "audio-pinyin":
            break;
        case "hanzi-pinyin":
            break;
        case "hanzi-meaning":
            break;
        case "meaning-hanzi":
            break;
        default:
            //"meaning-pinyin"
            break;
    }
}
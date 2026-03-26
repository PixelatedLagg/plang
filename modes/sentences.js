let sentencePlayer = document.getElementById("sentence-player");

//create sentence audio elements
var dataSentenceIndex = 0;
for (let sentence of data.sentences) {
    for (let child of sentence) {
        if (child.type === "text") {
            console.log("text");
            let audio = document.createElement("audio");
            audio.src = child.audio;
            audio.setAttribute("data-sentence-index", dataSentenceIndex++);
            player.append(audio);
        }
    }
}

function randomSelectSentence() {
    
}

function writeSentence() {
    var sentence = randomSelectSentence();
}
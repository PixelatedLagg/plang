var json = sessionStorage.getItem("plang-file");
var data = JSON.parse(json);

let player = document.getElementById("player");
let termList = document.getElementById("item-list");

//create audio elementsS
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


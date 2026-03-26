var createSentence = document.getElementById("sentence-new");
var deleteSentence = document.getElementById("sentence-delete");
var cancelSentence = document.getElementById("sentence-cancel");

var sentenceText = document.getElementById("sentence-add-text");
var sentenceGroup = document.getElementById("sentence-add-group");
var sentenceCustomGroup = document.getElementById("sentence-add-custom-group");

var sentenceContainer = document.getElementById("sentences");

var currentParticle = null;
var currentSentence = null;

var sentenceTextMenu = document.getElementById("sentence-text-menu");
var sentenceGroupMenu = document.getElementById("sentence-group-menu");
var sentenceCustomGroupMenu = document.getElementById("sentence-custom-group-menu");

var sentenceTextIndex = 0;
var sentenceRecording = false;

function disableSentenceInteractPanel() {
    hideSentenceMenu();
    deleteSentence.disabled = true;
    cancelSentence.disabled = true;
    sentenceText.disabled = true;
    sentenceGroup.disabled = true;
    sentenceCustomGroup.disabled = true;
    currentSentence = null;
    currentParticle = null;
    addTermsButton.disabled = false;
    editPhrasesButton.disabled = false;
    massImportButton.disabled = false;
}

disableSentenceInteractPanel();

//change sentence particle
function addToSentence(element) {
    if (sentenceRecording) {
        return;
    }
    var button = document.createElement("button");
    button.setAttribute("data-sentence-type", "text");
    button.onclick = function() {
        editParticle(button);
    }
    button.innerHTML = "Text";
    currentSentence = element;
    button.setAttribute("data-sentence-index", sentenceTextIndex++);
    currentSentence.appendChild(button);
    changePosition(button);
    editParticle(button);
}

//change sentence particle
function deleteFromSentence() {
    if (sentenceRecording) {
        return;
    }
    //if deleting last element, delete the sentence!
    if (currentSentence.children.length === 1) {
        sentenceContainer.removeChild(currentSentence.parentElement);
        disableSentenceInteractPanel();
        changePosition(null);
        return;
    }

    var index = Array.from(currentSentence.children).indexOf(currentParticle);
    currentSentence.removeChild(currentParticle);
    if (index === currentSentence.children.length) {
        index = currentSentence.children.length - 1;
    }
    changePosition(currentSentence.children[index]);
    editParticle(currentParticle);
}

function removeSentenceAudios(index) {
    for (let child of sentencePlayer.children) {
        if (child.getAttribute("data-sentence-index") === `${index}`) {
            sentencePlayer.removeChild(child);
        }
    }
}

function manageSentenceIndexes() {
    var index = 0;
    for (let sentence of sentenceContainer.children) {
        for (let button of sentence.children[1].children) {
            if (button.getAttribute("data-sentence-type") !== "text") {
                continue;
            }

            if (button.getAttribute("data-sentence-index") !== `${index}`) {
                var badIndex = button.getAttribute("data-sentence-index");
                for (let child of sentencePlayer.children) {
                    if (child.getAttribute("data-sentence-index") === `${badIndex}`) {
                        child.setAttribute("data-sentence-index", index);
                    }
                }
                button.setAttribute("data-sentence-type", index);
            }
            index++;
        }
    }
    sentenceTextIndex = index;
}

function editParticle(element) {
    if (sentenceRecording) {
        return;
    }
    hideSentenceMenu();
    switch (element.getAttribute("data-sentence-type")) {
        case "text":
            if (!element.hasAttribute("data-sentence-index")) {
                manageSentenceIndexes(element);
                element.setAttribute("data-sentence-index", sentenceTextIndex++);
            }
            sentenceTextMenu.style.display = "block";
            sentenceText.disabled = true;
            sentenceGroup.disabled = false;
            sentenceCustomGroup.disabled = false;
            if (element.hasAttribute("data-hanzi")) {
                sentenceTextHanzi.value = element.getAttribute("data-hanzi");
            }
            else {
                sentenceTextHanzi.value = "";
            }
            if (element.hasAttribute("data-pinyin")) {
                sentenceTextPinyin.value = element.getAttribute("data-pinyin");
            }
            else {
                sentenceTextPinyin.value = "";
            }
            if (element.hasAttribute("data-meaning")) {
                sentenceTextMeaning.value = element.getAttribute("data-meaning");
            }
            else {
                sentenceTextMeaning.value = "";
            }
            sentenceStart.disabled = false;
            sentenceStop.disabled = true;
            sentencePlay.disabled = true;
            sentenceTextSave.disabled = false;
            for (let child of sentencePlayer.children) {
                if (child.getAttribute("data-sentence-index") === element.getAttribute("data-sentence-index")) {
                    sentencePlay.disabled = false;
                    break;
                }
            }
            break;
        case "group":
            if (element.hasAttribute("data-sentence-index")) {
                removeSentenceAudios(element.getAttribute("data-sentence-index"));
                element.removeAttribute("data-sentence-index");
                manageSentenceIndexes();
            }
            sentenceGroupMenu.style.display = "block";
            sentenceText.disabled = false;
            sentenceGroup.disabled = true;
            sentenceCustomGroup.disabled = false;
            sentenceGroupSave.disabled = false;
            if (element.hasAttribute("data-group-name")) {
                console.log("hello");
                sentenceGroupSelect.value = element.getAttribute("data-group-name");
            }
            else {
                sentenceGroupSelect.innerHTML = groupSelectInner;
            }

            break;
        case "custom-group":
            if (element.hasAttribute("data-sentence-index")) {
                removeSentenceAudios(element.getAttribute("data-sentence-index"));
                element.removeAttribute("data-sentence-index");
                manageSentenceIndexes();
            }
            sentenceCustomGroupMenu.style.display = "block";
            sentenceText.disabled = false;
            sentenceGroup.disabled = false;
            sentenceCustomGroup.disabled = true;
            customGroupContainer.innerHTML = "";
            var terms = JSON.parse(element.getAttribute("data-term-indexes"));
            if (terms) {
                for (let term of terms) {
                    customGroupContainer.innerHTML += `<select class="select-term">${termSelectInner}</select>`;
                    customGroupContainer.children[customGroupContainer.children.length - 1].value = term;
                }
            }
            var groups = JSON.parse(element.getAttribute("data-group-names"));
            if (groups) {
                for (let group of groups) {
                    customGroupContainer.innerHTML += `<select>${groupSelectInner}</select>`;
                    customGroupContainer.children[customGroupContainer.children.length - 1].value = group;
                }
            }
            if (!terms && !groups) {
                customGroupContainer.innerHTML += `<span>Empty custom group</span>`;
            }
            break;
    }
    deleteSentence.disabled = false;
    cancelSentence.disabled = false;
    changePosition(element);
}

//change sentence particle
deleteSentence.onclick = function() {
    if (sentenceRecording) {
        return;
    }
    sentenceContainer.removeChild(currentSentence.parentElement);
    disableSentenceInteractPanel();
    changePosition(null);
}

//change sentence particle
cancelSentence.onclick = function() {
    if (sentenceRecording) {
        return;
    }
    if (currentParticle !== null) {
        currentParticle.style.border = "none";
    }
    disableSentenceInteractPanel();
    changePosition(null);
}

sentenceText.onclick = function() {
    if (sentenceRecording) {
        return;
    }
    hideSentenceMenu();
    sentenceText.disabled = true;
    sentenceGroup.disabled = false;
    sentenceCustomGroup.disabled = false;
    sentenceTextMenu.style.display = "block";
    currentParticle.setAttribute("data-sentence-type", "text");
    currentParticle.innerHTML = "Text";
    editParticle(currentParticle);
}

sentenceGroup.onclick = function() {
    if (sentenceRecording) {
        return;
    }
    hideSentenceMenu();
    sentenceText.disabled = false;
    sentenceGroup.disabled = true;
    sentenceCustomGroup.disabled = false;
    sentenceGroupMenu.style.display = "block";
    currentParticle.setAttribute("data-sentence-type", "group");
    currentParticle.innerHTML = "Group";
    editParticle(currentParticle);
}

sentenceCustomGroup.onclick = function() {
    if (sentenceRecording) {
        return;
    }
    hideSentenceMenu();
    sentenceText.disabled = false;
    sentenceGroup.disabled = false;
    sentenceCustomGroup.disabled = true;
    sentenceCustomGroupMenu.style.display = "block";
    currentParticle.setAttribute("data-sentence-type", "custom-group");
    currentParticle.innerHTML = "Custom Group";
    editParticle(currentParticle);
}

//change sentence particle
createSentence.onclick = function() {
    if (sentenceRecording) {
        return;
    }
    var container = document.createElement("div");
    container.className = "sentence";

    var left = document.createElement("div");
    left.className = "left";
    
    var addToSentenceButton = document.createElement("button");
    addToSentenceButton.onclick = function() {
        addToSentence(right);
    }
    addToSentenceButton.innerText = "+";
    left.appendChild(addToSentenceButton);
    container.appendChild(left);

    var right = document.createElement("div");
    container.appendChild(right);

    sentenceContainer.appendChild(container);
    currentSentence = right;
    addToSentence(right);
}

function changePosition(newParticle) {
    if (currentParticle !== null) {
        currentParticle.style.border = "unset";
    }
    if (newParticle === null) {
        currentParticle = null;
        currentSentence = null;
        return;
    }
    addTermsButton.disabled = true;
    editPhrasesButton.disabled = true;
    massImportButton.disabled = true;
    currentParticle = newParticle;
    currentSentence = currentParticle.parentElement;
    currentParticle.style.border = "2px solid black";
    console.log(currentParticle);
}

function hideSentenceMenu() {
    sentenceTextMenu.style.display = "none";
    sentenceGroupMenu.style.display = "none";
    sentenceCustomGroupMenu.style.display = "none";
}

function toggleSentenceText(text) {
    sentenceTextMenu.style.display = "block";
    sentenceHanzi.value = text.getAttribute("data-hanzi");
    sentencePinyin.value = text.getAttribute("data-pinyin");
    sentenceMeaning.value = text.getAttribute("data-meaning");
}

/* text! */

var sentenceTextHanzi = document.getElementById("sentence-text-hanzi");
var sentenceTextPinyin = document.getElementById("sentence-text-pinyin");
var sentenceTextMeaning = document.getElementById("sentence-text-meaning");

var sentenceTextSave = document.getElementById("sentence-text-save");

sentenceTextSave.disabled = true;

sentenceTextHanzi.oninput = sentenceTextPinyin.oninput = sentenceTextMeaning.oninput = function() {
    if (sentenceTextSave.disabled) {
        sentenceTextSave.disabled = false;
    }
}

sentenceTextSave.onclick = function() {
    var hanzi = sentenceTextHanzi.value;
    if (!hanzi) {
        alert("Invalid hanzi!");
        return;
    }

    for (var char of hanzi.split('')) {
        if (!isChinese(char)) {
            alert("Invalid hanzi!");
            return;
        }
    }

    var pinyin = sentenceTextPinyin.value;
    if (!pinyin) {
        alert("Invalid pinyin!");
        return;
    }
    pinyin = convertPinyinTones(pinyin);

    var meaning = sentenceTextMeaning.value;
    if (!meaning) {
        alert("Invalid meaning!");
        return;
    }

    sentenceTextSave.disabled = true;

    currentParticle.setAttribute("data-hanzi", hanzi);
    currentParticle.setAttribute("data-pinyin", pinyin);
    currentParticle.setAttribute("data-meaning", meaning);
    //player-sentence audio saving stuffs! :)))
}

var sentenceStart = document.getElementById("sentence-start");
var sentenceStop = document.getElementById("sentence-stop");
var sentencePlay = document.getElementById("sentence-play");
var sentencePlayer = document.getElementById("sentence-player");

sentenceStart.onclick = function() {
    sentenceStart.disabled = true;
    sentenceStop.disabled = false;
    sentencePlay.disabled = true;

    sentenceRecording = true;

    var Recorder = window.Recorder;
    window.recorder2 = Recorder({ type: "mp3", sampleRate: 16000, bitRate: 16 });
    recorder2.open(function () {
        recorder2.start();
    }, function (msg, isUserNotAllow) {
        //error
        sentenceRecording = false;
    });
}

sentenceStop.onclick = function() {
    sentenceStart.disabled = false;
    sentenceStop.disabled = true;
    sentencePlay.disabled = false;

    sentenceRecording = false;

    recorder2.stop(function (blob, duration) {
        var localUrl = (window.URL || webkitURL).createObjectURL(blob);

        recorder2.close();
        recorder2 = null;

        //if audio already exists, edit its src
        for (var child of sentencePlayer.children) {
            if (child.getAttribute("data-sentence-index") == currentParticle.getAttribute("data-sentence-index")) {
                child.src = localUrl;
                return;
            }
        }

        let audio = document.createElement("audio");
        audio.src = localUrl;
        audio.setAttribute("data-sentence-index", currentParticle.getAttribute("data-sentence-index"));
        sentencePlayer.append(audio);

    }, function (msg) {
        //error
        recorder2.close();
        recorder2 = null;
    });
};

sentencePlay.onclick = () => {
    sentenceStart.disabled = true;
    sentenceStop.disabled = true;
    sentencePlay.disabled = true;

    for (var child of sentencePlayer.children) {
        if (child.getAttribute("data-sentence-index") == currentParticle.getAttribute("data-sentence-index")) {
            child.onended = () => {
                child.currentTime = 0;
                sentenceStart.disabled = false;
                sentenceStop.disabled = true;
                sentencePlay.disabled = false;
            }
            child.play();
            break;
        }
    }
};

/* group! */

var groupSelectInner = "";
var termSelectInner = "";
var sentenceGroupSave = document.getElementById("sentence-group-save");
var sentenceGroupSelect = document.getElementById("sentence-group-select");

function toggleSentences() {
    groupSelectInner = "";
    for (let child of phraseGroupButtons.children) {
        groupSelectInner += `<option value="${child.getAttribute("data-group-name")}">${child.getAttribute("data-group-name")}</option>`;
    }

    termSelectInner = "";
    for (let child of termList.children) {
        termSelectInner += `<option value="${child.getAttribute("data-index")}">${child.innerHTML}</option>`;
    }

    sentenceGroupSelect.innerHTML = groupSelectInner;
}

sentenceGroupSave.onclick = function() {
    sentenceGroupSave.disabled = true;
    currentParticle.setAttribute("data-group-name", sentenceGroupSelect.value);
}

sentenceGroupSelect.oninput = function() {
    sentenceGroupSave.disabled = false;
}

/* custom group! */

var customGroupAddTerm = document.getElementById("custom-group-add-term");
var customGroupAddGroup = document.getElementById("custom-group-add-group");
var customGroupRemove = document.getElementById("custom-group-remove");

customGroupRemove.disabled = true;

var customGroupContainer = document.getElementById("custom-group-container");

customGroupAddTerm.onclick = function() {
    console.log("here");
    console.log(customGroupContainer.children[0].tagName);
    if (customGroupContainer.children.length === 1 && customGroupContainer.children[0].tagName === "SPAN") {
        customGroupContainer.innerHTML = "";
        console.log("hi");
        customGroupRemove.disabled = false;
    }
    customGroupContainer.innerHTML += `<select class="select-term">${termSelectInner}</select`;
}

customGroupAddGroup.onclick = function() {
    if (customGroupContainer.children.length === 1 && customGroupContainer.children[0].tagName === "SPAN") {
        customGroupContainer.innerHTML = "";
        customGroupRemove.disabled = false;
    }
    customGroupContainer.innerHTML += `<select>${groupSelectInner}</select>`;
}

customGroupRemove.onclick = function() {
    if (customGroupContainer.children.length === 1) {
        customGroupContainer.innerHTML = "<span>Empty custom group</span>";
        customGroupRemove.disabled = true;
        return;
    }
    customGroupContainer.removeChild(customGroupContainer.lastChild);
}

var customGroupSave = document.getElementById("custom-group-save");

customGroupSave.onclick = function() {
    var termIndexes = [];
    var groupNames = [];
    for (let child of customGroupContainer.children) {
        //term
        if (child.className === "select-term") {
            if (!child.value) {
                alert("Cannot add empty term!");
                return;
            }
            termIndexes.push(child.value);
        }
        else {
            //group
            if (!child.value) {
                alert("Cannot add empty group!");
                return;
            }
            groupNames.push(child.value);
        }
    }
    currentParticle.setAttribute("data-term-indexes", JSON.stringify(termIndexes));
    currentParticle.setAttribute("data-group-names", JSON.stringify(groupNames));
}
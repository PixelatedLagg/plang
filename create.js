let currentIndex = 0;
let recordStart = document.getElementById("record-start");
let recordStop = document.getElementById("record-stop");
let recordPlay = document.getElementById("record-play");
const player = document.getElementById("player");

recordStart.disabled = false;
recordStop.disabled = true;
recordPlay.disabled = true;

recordStart.onclick = () => {
    recordStart.disabled = true;
    recordStop.disabled = false;
    recordPlay.disabled = true;

    var Recorder = window.Recorder;
    window.recorder2 = Recorder({ type: "mp3", sampleRate: 16000, bitRate: 16 });
    recorder2.open(function () {
        recorder2.start();
    }, function (msg, isUserNotAllow) {
        //error
    });
};

recordStop.onclick = () => {
    recordStart.disabled = false;
    recordStop.disabled = true;
    recordPlay.disabled = false;

    recorder2.stop(function (blob, duration) {
        var localUrl = (window.URL || webkitURL).createObjectURL(blob);

        recorder2.close();
        recorder2 = null;

        //if audio already exists, edit its src
        for (var child of player.children) {
            if (child.getAttribute("data-index") == currentIndex) {
                child.src = localUrl;
                return;
            }
        }

        let audio = document.createElement("audio");
        audio.src = localUrl;
        audio.setAttribute("data-index", currentIndex);
        player.append(audio);

    }, function (msg) {
        //error
        recorder2.close();
        recorder2 = null;
    });
};

recordPlay.onclick = () => {
    recordStart.disabled = true;
    recordStop.disabled = true;
    recordPlay.disabled = true;

    for (var child of player.children) {
        if (child.getAttribute("data-index") == currentIndex) {
            child.onended = () => {
                child.currentTime = 0;
                recordStart.disabled = false;
                recordStop.disabled = true;
                recordPlay.disabled = false;
            }
            child.play();
            break;
        }
    }
};

let createItems = [];
let formHanzi = document.getElementById("form-hanzi");
let formPinyin = document.getElementById("form-pinyin");
let formMeaning = document.getElementById("form-meaning");

let formNew = document.getElementById("form-new");
let formEdit = document.getElementById("form-edit");
let formDelete = document.getElementById("form-delete");
let formCancel = document.getElementById("form-cancel");

const termList = document.getElementById("item-list")

formNew.disabled = false;
formDelete.disabled = true;
formEdit.disabled = true;
formCancel.disabled = true;

function isChinese(char) {
    const point = char.codePointAt(0);
    if (char === '？' || char === ' ' || char === '。' || char === '，' || char === '；' || char === '‘' || char === '！') {
        return true;
    }
    return (parseInt("4E00", 16) <= point && point <= parseInt("9FFF", 16)) || (parseInt("3400", 16) <= point && point <= parseInt("4DBF", 16));
}

var addTermsButton = document.getElementById("add-terms");
var editPhrasesButton = document.getElementById("edit-phrases");
var editSentencesButton = document.getElementById("edit-sentences");
var massImportButton = document.getElementById("mass-import");
var currentButton = addTermsButton;

var markAsRootTermButton = document.getElementById("mark-as-root-term");
var childrenButton = document.getElementById("select-children");
var doneChildrenButton = document.getElementById("done-select-children");
var phraseCancel = document.getElementById("phrase-cancel");
var treeViewButton = document.getElementById("tree-view");
var selectingChildren = false;



markAsRootTermButton.disabled = true;
markAsRootTermButton.checked = false;
childrenButton.disabled = true;
phraseCancel.disabled = true;
treeViewButton.checked = false;
doneChildrenButton.disabled = true;

/*
好; hao3; good
你好; ni3hao3; hello
您好; nin2hao3; hello (formal)
国; guo2; country
中国; zhong1guo2; China
美国; mei3guo2; USA
*/

function getNextIndex(array) {
    for (var i = 0; i < array.length; i++) {
        if (array[i] === 0) {
            return i;
        }
    }
    return -1;
}

function treeView() {
    var length = termList.children.length;
    let rootTerms = Array(length).fill(null);
    let childTerms = Array(length).fill(null);
    for (var i = 0; i < length; i++) {
        childTerms[i] = [];
    }
    let rootlessTerms = [];

    for (let child of termList.children) {
        //root term
        if (child.getAttribute("data-root-term") === child.getAttribute("data-index")) {
            rootTerms[child.getAttribute("data-root-term")] = child;
            continue;
        }
        //rootless term
        if (child.getAttribute("data-root-term") === "") {
            rootlessTerms.push(child);
            continue;
        }
        childTerms[child.getAttribute("data-root-term")].push(child);
        console.table(childTerms);
    }

    termList.innerHTML = "";

    //add rootless terms first :)
    for (let child of rootlessTerms) {
        termList.appendChild(child);
    }

    for (var i = 0; i < length; i++) {
        //no root term at index
        if (rootTerms[i] === null) {
            continue;
        }
        termList.appendChild(rootTerms[i]);
        for (let child of childTerms[i]) {
            child.classList.add("child");
            termList.appendChild(child);
        }
    }
}

function normalizeView() {
    let resetTermList = Array(termList.children.length).fill(null);
    for (let child of termList.children) {
        child.classList.remove("child");
        resetTermList[child.getAttribute("data-index")] = child;
    }

    termList.innerHTML = "";
    for (var i = 0; i < resetTermList.length; i++) {
        termList.appendChild(resetTermList[i]);
    }
}

treeViewButton.onchange = function() {
    if (treeViewButton.checked) {
        treeView();
    }
    else {
        normalizeView();
    }
}

markAsRootTermButton.onchange = function() {
    if (markAsRootTermButton.checked) {
        //set root term of item to itself to indicate it is a root term! :)
        let item = getTermByIndex(currentIndex, termList);
        item.setAttribute("data-root-term", currentIndex);
        childrenButton.disabled = false;
    }
    else {
        //no more root term!
        for (let child of termList.children) {
            if (child.getAttribute("data-root-term") === currentIndex) {
                child.setAttribute("data-root-term", "");
            }
        }
        childrenButton.disabled = true;
    }
}

function getTermByIndex(index) {
    for (let child of termList.children) {
        if (child.getAttribute("data-index") === index) {
            return child;
        }
    }
    return null;
}

childrenButton.onclick = function() {
    selectingChildren = true;
    doneChildrenButton.disabled = false;
    phraseCancel.disabled = true;
    childrenButton.disabled = true;
    markAsRootTermButton.disabled = true;
    treeViewButton.disabled = true;
    markSubterms(currentIndex);
}

function markSubterms(rootIndex) {
    for (let child of termList.children) {
        //if child is a root term, it is boxed
        if (child.getAttribute("data-index") === child.getAttribute("data-root-term")) {
            child.style.textDecoration = "none";
            child.style.border = "1px solid black";
            continue;
        }
        //if child is a child of current root index, it is underlined
        if (child.getAttribute("data-root-term") === rootIndex) {
            child.style.textDecoration = "underline";
        }
    }
}
//TODO: stop from selecting other root terms when selecting children!
doneChildrenButton.onclick = function() {
    selectingChildren = false;
    doneChildrenButton.disabled = true;
    let item = getTermByIndex(currentIndex, termList);
    for (let child of termList.children) {
        child.style.border = "none";
        child.style.textDecoration = "none";
    }
    item.style.textDecoration = "underline";
    phraseCancel.disabled = false;
    childrenButton.disabled = false;
    markAsRootTermButton.disabled = false;
    treeViewButton.disabled = false;
}

phraseCancel.onclick = function() {
    addTermsButton.disabled = false;
    editSentencesButton.disabled = false;
    massImportButton.disabled = false;

    markAsRootTermButton.checked = false;
    markAsRootTermButton.disabled = true;
    childrenButton.disabled = true;
    phraseCancel.disabled = true;
    clearMarkingButton.disabled = true;

    let item = getTermByIndex(currentIndex, termList);
    item.style.textDecoration = "none";
    currentIndex = termList.children.length;
}

formNew.onclick = () => {
    if (!validateForm()) {
        return;
    }

    var hanzi = formHanzi.value;
    var pinyin = formPinyin.value;
    var meaning = formMeaning.value;

    createNewTerm(hanzi, pinyin, meaning);

    formHanzi.value = "";
    formPinyin.value = "";
    formMeaning.value = "";

    recordStart.disabled = false;
    recordStop.disabled = true;
    recordPlay.disabled = true;

    currentIndex = termList.children.length;
}

formEdit.onclick = () => {
    formNew.disabled = false;
    formEdit.disabled = true;
    formDelete.disabled = true;
    formCancel.disabled = true;

    if (!validateForm()) {
        return;
    }

    var hanzi = formHanzi.value;
    var pinyin = convertPinyinTones(formPinyin.value);;
    var meaning = formMeaning.value;

    let item = termList.children[currentIndex];
    item.setAttribute("data-hanzi", hanzi);
    item.setAttribute("data-pinyin", pinyin);
    item.setAttribute("data-meaning", meaning);

    item.style.color = "black";
    item.innerHTML = hanzi + "; " + pinyin + "; " + meaning;

    formHanzi.value = "";
    formPinyin.value = "";
    formMeaning.value = "";

    editPhrasesButton.disabled = false;
    editSentencesButton.disabled = false;
    massImportButton.disabled = false;
}

formDelete.onclick = () => {
    formNew.disabled = false;
    formEdit.disabled = true;
    formDelete.disabled = true;
    formCancel.disabled = true;

    formHanzi.value = "";
    formPinyin.value = "";
    formMeaning.value = "";

    for (let child of sentenceContainer.children) {
        for (let button of child.children[1].children) {
            if (button.getAttribute("data-sentence-type") === "custom-group") {
                var terms = JSON.parse(button.getAttribute("data-term-indexes"));
                for (let term of terms) {
                    //if term found, remove it! :)))
                    if (term === `${currentIndex}`) {
                        terms.splice(terms.indexOf(term), 1);
                    }
                }
                button.setAttribute("data-term-indexes", JSON.stringify(terms));
            }
        }
    }

    for (let child of player.children) {
        if (child.getAttribute("data-index") == currentIndex) {
            player.removeChild(child);
            break;
        }
    }
    var childToRemove = termList.children[currentIndex];
    termList.removeChild(childToRemove);

    var i = 0;
    for (let term of termList.children) {
        var oldIndex = term.getAttribute("data-index");

        //ensure all terms and audios have proper data-index!
        if (oldIndex != i) {
            term.setAttribute("data-index", i);
            for (var child of player.children) {
                if (child.getAttribute("data-index") == oldIndex) {
                    child.setAttribute("data-index", i);
                }
            }
        }
        i++;
    }

    editPhrasesButton.disabled = false;
    editSentencesButton.disabled = false;
    massImportButton.disabled = false;
}

formCancel.onclick = () => {
    editPhrasesButton.disabled = false;
    editSentencesButton.disabled = false;
    massImportButton.disabled = false;
    formNew.disabled = false;
    formEdit.disabled = true;
    formDelete.disabled = true;
    formCancel.disabled = true;
    let item = termList.children[currentIndex];
    item.style.color = "black";

    currentIndex = termList.children.length;
    formHanzi.value = "";
    formPinyin.value = "";
    formMeaning.value = "";
}

function validateForm() {
    var hanzi = formHanzi.value;
    if (!hanzi) {
        alert("Invalid hanzi!");
        return false;
    }

    for (var char of hanzi.split('')) {
        if (!isChinese(char)) {
            alert("Invalid hanzi!");
            return false;
        }
    }

    var pinyin = formPinyin.value;
    if (!pinyin) {
        alert("Invalid pinyin!");
        return false;
    }
    pinyin = convertPinyinTones(pinyin);

    var meaning = formMeaning.value;
    if (!meaning) {
        alert("Invalid meaning!");
        return false;
    }
    return true;
}

//first divider

let useAudio = document.getElementById("form-use-audio");

//second divider

let openTest = document.getElementById("open-test");
let finish = document.getElementById("finish");
let testValue = document.getElementById("form-test-value");
let massImport = document.getElementById("mass-import");

openTest.onclick = () => {
    window.open("./testcreate.html", '_blank').focus();
}

function generateWithBase64() {
    let blobs = new Map();
    let sentenceBlobs = new Map();
    let strings = new Map();
    let sentenceStrings = new Map();
    let promises = [];
    let sentencePromises = [];

    if (player.children.length !== termList.children.length) {
        alert("One or more terms is missing audio!");
        return;
    }
    //skip all of this if no audio exists!
    if (player.children.length === 0 && sentencePlayer.children.length === 0) {
        generateFile(strings, sentenceStrings);
        return;
    }

    //read blobs
    for (let child of player.children) {
        console.log("blob promise started: " + child.getAttribute("data-index"));
        promises.push(fetch(child.src)
            .then(r => { return r.blob() })
            .then(r => {
                blobs.set(child.getAttribute("data-index"), r);
                console.log("blob promise done: " + child.getAttribute("data-index"));
            }));
    }

    for (let child of sentencePlayer.children) {
        console.log("sentence blob promise started: " + child.getAttribute("data-sentence-index"));
        sentencePromises.push(fetch(child.src)
            .then(r => { return r.blob() })
            .then(r => {
                sentenceBlobs.set(child.getAttribute("data-sentence-index"), r);
                console.log(sentenceBlobs);
                console.log(r);
                console.log("sentence blob promise done: " + child.getAttribute("data-sentence-index"));
            }));
    }

    var termsDone = false;
    var sentencesDone = false;

    Promise.allSettled(promises).then(() => {
        let counter = 0;
        for (let child of player.children) {
            let reader = new FileReader();
            reader.onload = () => {
                console.log(counter);
                counter++;
                strings.set(child.getAttribute("data-index"), reader.result);

                if (counter === player.children.length) {
                    if (sentencesDone || sentencePlayer.children.length === 0) {
                        generateFile(strings, sentenceStrings);
                    }
                    else {
                        termsDone = true;
                    }
                }
            }
            console.log(blobs);
            reader.readAsDataURL(blobs.get(child.getAttribute("data-index")));
        }
    });

    Promise.allSettled(sentencePromises).then(() => {
        let sentenceCounter = 0;
        for (let child of sentencePlayer.children) {
            if (!child.hasAttribute("data-sentence-index")) {
                continue;
            }
            let reader = new FileReader();
            reader.onload = () => {
                console.log(sentenceCounter);
                sentenceCounter++;
                sentenceStrings.set(child.getAttribute("data-sentence-index"), reader.result);

                if (sentenceCounter === sentencePlayer.children.length) {
                    if (termsDone || player.children.length === 0) {
                        generateFile(strings, sentenceStrings);
                    }
                    else {
                        sentencesDone = true;
                    }
                }
            }
            console.log("child attr: " + sentenceBlobs.size);
            reader.readAsDataURL(sentenceBlobs.get(child.getAttribute("data-sentence-index")));
        }
    });
}

finish.onclick = async function() {
    if (testValue.value) {
        let regex = /^([a-zA-Z0-9]{4}-[a-zA-Z0-9]{4})$/;
        if (!regex.test(testValue.value)) {
            alert("Invalid test value!");
            return;
        }
    }

    generateWithBase64();
}

function generateFile(blobs, sentenceBlobs) {
    const result = {
        settings: {
            testValue: testValue.value
        },
        terms: [],
        sentences: [],
        groups: [],
        subphrases: []
    }

    for (var child of termList.children) {
        result.terms.push({
            hanzi: child.getAttribute("data-hanzi"),
            pinyin: child.getAttribute("data-pinyin"),
            meaning: child.getAttribute("data-meaning"),
            audio: blobs.get(child.getAttribute("data-index")),
            group: child.getAttribute("data-group-name")
        });
    }

    for (let child of sentenceContainer.children) {
        var sentenceArray = [];
        for (let button of child.children[1].children) {
            var sentence;
            switch (button.getAttribute("data-sentence-type")) {
                case "text":
                    sentence = {
                        type : "text",
                        hanzi : button.getAttribute("data-hanzi"),
                        pinyin : button.getAttribute("data-pinyin"),
                        meaning : button.getAttribute("data-meaning"),
                        audio : sentenceBlobs.get(button.getAttribute("data-sentence-index"))
                    };
                    break;
                case "group":
                    sentence = {
                        type : "group",
                        name : button.getAttribute("data-group-name")
                    };
                    break;
                case "custom-group":
                    console.log("custom group const");
                    sentence = {
                        type : "custom-group",
                        terms : button.getAttribute("data-term-indexes"),
                        groups : button.getAttribute("data-group-names")
                    };
                    console.log(sentence);
                    break;
            }
            sentenceArray.push(sentence);
        }
        result.sentences.push(sentenceArray);
    }

    for (let child of phraseGroupButtons.children) {
        result.groups.push({
            name: child.getAttribute("data-group-name"),
            color: child.style.backgroundColor
        })
    }

    for (let child of termList.children) {
        //find root phrases
        if (child.getAttribute("data-index") === child.getAttribute("data-root-term")) {
            const subphraseJson = {
                index: child.getAttribute("data-root-term"),
                subphrases: []
            }
            for (let subphrase of termList.children) {
                if (subphrase.getAttribute("data-index") != subphrase.getAttribute("data-root-term") &&
                    subphrase.getAttribute("data-root-term") === child.getAttribute("data-index")) {
                    subphraseJson.subphrases.push(subphrase.getAttribute("data-index"));
                }
            }
            result.subphrases.push(subphraseJson);
        }
    }

    save("file.plang", JSON.stringify(result));
}

//https://stackoverflow.com/a/33542499
function save(filename, data) {
    const blob = new Blob([data], {type: 'application/json'});
    if (window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveBlob(blob, filename);
    }
    else {
        const elem = window.document.createElement('a');
        elem.href = window.URL.createObjectURL(blob);
        elem.download = filename;        
        document.body.appendChild(elem);
        elem.click();        
        document.body.removeChild(elem);
    }
}

function createNewTerm(hanzi, pinyin, meaning) {
    pinyin = convertPinyinTones(pinyin);
    let newTerm = document.createElement("p");
    newTerm.innerText = hanzi + "; " + pinyin + "; " + meaning;
    newTerm.className = "create-item";
    newTerm.setAttribute("data-hanzi", hanzi);
    newTerm.setAttribute("data-pinyin", pinyin);
    newTerm.setAttribute("data-meaning", meaning);
    newTerm.setAttribute("data-index", termList.children.length);
    newTerm.setAttribute("data-root-term", "");

    newTerm.onclick = () => {
        if (selectingChildren) {
            //cannot make root element's root itself! :)
            if (currentIndex === newTerm.getAttribute("data-index")) {
                return;
            }
            
            //other root element, get rid of its children
            if (newTerm.getAttribute("data-index") === newTerm.getAttribute("data-root-index")) {
                for (let child of termList.children) {
                    if (child.getAttribute("data-root-term") === newTerm.getAttribute("data-index")) {
                        child.setAttribute("data-root-term", "");
                    }
                }
                newTerm.setAttribute("data-root-term", currentIndex);
                return;
            }

            //deselect this term
            if (newTerm.style.textDecoration === "underline") {
                newTerm.style.textDecoration = "none";
                newTerm.setAttribute("data-root-term", "");
            }
            else {
                //select this term
                newTerm.style.textDecoration = "underline";
                newTerm.setAttribute("data-root-term", currentIndex);
            }
            return;
        }

        if (termList.children.length > currentIndex) {
            //last one
            var oldTerm = getTermByIndex(currentIndex, termList);
            if (oldTerm != null) {
                oldTerm.style.color = "black";
                oldTerm.style.textDecoration = "none";
            }
        }

        currentIndex = newTerm.getAttribute("data-index");

        if (currentButton === addTermsButton) {
            editPhrasesButton.disabled = true;
            editSentencesButton.disabled = true;
            massImportButton.disabled = true;

            formHanzi.value = newTerm.getAttribute("data-hanzi");
            formPinyin.value = newTerm.getAttribute("data-pinyin");
            formMeaning.value = newTerm.getAttribute("data-meaning");
            formNew.disabled = true;
            formEdit.disabled = false;
            formDelete.disabled = false;
            formCancel.disabled = false;

            for (var child of player.children) {
                if (child.getAttribute("data-index") == currentIndex) {
                    recordPlay.disabled = false;
                }
            }
            newTerm.style.color = "red";
        }
        if (currentButton === editPhrasesButton) {
            addTermsButton.disabled = true;
            editSentencesButton.disabled = true;
            massImportButton.disabled = true;
            newTerm.style.textDecoration = "underline";

            //this term is a root term
            if (newTerm.getAttribute("data-root-term") === newTerm.getAttribute("data-index")) {
                markAsRootTermButton.checked = true;
                childrenButton.disabled = false;
            }
            else {
                markAsRootTermButton.checked = false;
                childrenButton.disabled = true;
            }

            markAsRootTermButton.disabled = false;
            phraseCancel.disabled = false;
            clearMarkingButton.disabled = false;
        }
    }

    newTerm.setAttribute("data-group-name", "");
    newTerm.setAttribute("data-root-term", "");

    termList.append(newTerm);
}

/* edit phrases */

Coloris({
    "theme" : "pill",
    "alpha" : false,
    "format" : "hex"
});

var interactMenu = document.getElementById("interact-menu");
var phraseInteractMenu = document.getElementById("phrase-interact-menu");
var addNewGroup = document.getElementById("add-new-group");
var deleteGroup = document.getElementById("delete-group");
var editGroup = document.getElementById("edit-group");
var cancelGroup = document.getElementById("cancel-group");

var groupNameText = document.getElementById("group-name");
var groupColorText = document.getElementById("color-picker");
var colorField = document.getElementsByClassName("clr-field")[0];
var clearMarkingButton = document.getElementById("clear-marking");

clearMarkingButton.onclick = function() {
    let term = getTermByIndex(currentIndex, termList);
    term.setAttribute("data-group-name", "");
    term.removeAttribute("data-color");
    term.style.backgroundColor = "white";
}

deleteGroup.disabled = true;
editGroup.disabled = true;
cancelGroup.disabled = true;
clearMarkingButton.disabled = true;

function resetColor() {
    groupColorText.value = "#000000";
    document.getElementsByClassName('clr-field')[0].style.color = "#000000";
}

var selectedButton = null;

function markAsGroup(button) {
    //means no term is currently selected
    if (currentIndex === termList.children.length) {
        addNewGroup.disabled = true;
        deleteGroup.disabled = false;
        editGroup.disabled = false;
        cancelGroup.disabled = false;

        selectedButton = button;
        groupNameText.value = button.getAttribute("data-group-name");
        groupColorText.value = button.style.backgroundColor;
        document.getElementsByClassName('clr-field')[0].style.color = button.style.backgroundColor;
    }
    else {
        let item = getTermByIndex(currentIndex, termList);
        item.setAttribute("data-group-name", button.getAttribute("data-group-name"));
        item.setAttribute("data-color", button.style.backgroundColor);
        item.style.backgroundColor = button.style.backgroundColor;
    }
}

editGroup.onclick = function() {
    if (groupNameText.value == null || groupNameText.value.length === 0) {
        alert("Invalid group name!");
        return;
    }

    //no duplicates!
    for (let group of phraseGroups) {
        if (groupNameText.value === group && selectedButton.getAttribute("data-group-name") != group) {
            return;
        }
    }

    for (let child of termList.children) {
        //find children with button group
        if (child.getAttribute("data-group-name") === selectedButton.getAttribute("data-group-name")) {
            child.setAttribute("data-group-name", groupNameText.value);
            child.style.backgroundColor = document.getElementsByClassName('clr-field')[0].style.color;
            child.setAttribute("data-color", document.getElementsByClassName('clr-field')[0].style.color);
        }
    }

    phraseGroups.splice(phraseGroups.indexOf(selectedButton.getAttribute("data-group-name")), 1);
    phraseGroups.push(groupNameText.value);

    selectedButton.setAttribute("data-group-name", groupNameText.value);
    selectedButton.innerHTML = "Mark as " + groupNameText.value;
    selectedButton.style.backgroundColor = document.getElementsByClassName('clr-field')[0].style.color;


    groupNameText.value = "";
    resetColor();
    addNewGroup.disabled = false;
    editGroup.disabled = true;
    deleteGroup.disabled = true;
    cancelGroup.disabled = true;

    selectedButton = null;
}

var phraseGroups = ["noun", "verb", "noun-verb", "adjective", "adverb"];
var phraseGroupButtons = document.getElementById("phrase-group-buttons");

addNewGroup.onclick = function() {
    var text = groupNameText.value;
    if (text == null || text.length === 0) {
        alert("Invalid group name!");
        return;
    }

    //no duplicates!
    for (let group of phraseGroups) {
        if (text === group) {
            return;
        }
    }

    var color = document.getElementsByClassName("clr-field")[0].style.color;
    var newGroupButton = `<button data-group-name="${text}" style="background-color: ${color};" onclick="markAsGroup(this);">Mark as ${text}</button>`;

    if (phraseGroups.length === 0) {
        phraseGroupButtons.innerHTML = "";
    }

    phraseGroupButtons.innerHTML += newGroupButton;
    phraseGroups.push(text);

    groupNameText.value = "";
    resetColor();
}

deleteGroup.onclick = function() {
    for (let child of termList.children) {
        //find children with button group
        if (child.getAttribute("data-group-name") === selectedButton.getAttribute("data-group-name")) {
            child.setAttribute("data-group-name", "");
            child.style.backgroundColor = "white";
            child.setAttribute("data-color", "");
        }
    }

    phraseGroups.splice(phraseGroups.indexOf(selectedButton.getAttribute("data-group-name")), 1);
    phraseGroupButtons.removeChild(selectedButton);

    groupNameText.value = "";
    resetColor();
    addNewGroup.disabled = false;
    editGroup.disabled = true;
    deleteGroup.disabled = true;
    cancelGroup.disabled = true;
    selectedButton = null;

    if (phraseGroups.length === 0) {
        phraseGroupButtons.innerHTML = "<span>No phrase groups</span>";
    }
}

cancelGroup.onclick = function() {
    groupNameText.value = "";
    resetColor();
    addNewGroup.disabled = false;
    editGroup.disabled = true;
    deleteGroup.disabled = true;
    cancelGroup.disabled = true;
    selectedButton = null;
}


var addTermsMenu = document.getElementById("add-terms-menu");
var editSentencesMenu = document.getElementById("edit-sentences-menu");
var massImportMenu = document.getElementById("mass-import-menu");
var currentMenu = addTermsMenu;

function selectButton(button) {
    currentButton.classList.remove("selected");
    button.classList.add("selected");
}

addTermsButton.onclick = () => {
    selectButton(addTermsButton);
    currentMenu.style.display = "none";
    addTermsMenu.style.display = "grid";
    interactMenu.style.display = "block";
    phraseInteractMenu.style.display = "none";
    currentButton.disabled = false;
    currentButton = addTermsButton;
    currentButton.disabled = true;
    currentMenu = addTermsMenu;
}

selectButton(addTermsButton);
addTermsButton.disabled = true;

editPhrasesButton.onclick = () => {
    selectButton(editPhrasesButton);
    currentMenu.style.display = "none";
    addTermsMenu.style.display = "grid";
    interactMenu.style.display = "none";
    phraseInteractMenu.style.display = "block";
    currentButton.disabled = false;
    currentButton = editPhrasesButton;
    currentButton.disabled = true;
    currentMenu = addTermsMenu;
}

editSentencesButton.onclick = () => {
    selectButton(editSentencesButton);
    currentMenu.style.display = "none";
    editSentencesMenu.style.display = "grid";
    currentButton.disabled = false;
    currentButton = editSentencesButton;
    currentButton.disabled = true;
    currentMenu = editSentencesMenu;
    toggleSentences();
}

massImportButton.onclick = () => {
    selectButton(massImportButton);
    currentMenu.style.display = "none";
    massImportMenu.style.display = "block";
    currentButton.disabled = false;
    currentButton = massImportButton;
    currentButton.disabled = true;
    currentMenu = massImportMenu;
}

//mass import

var massImportParseOrder = document.getElementById("parse-order");

function changeText(element) {
    var text = prompt("Input text:");
    if (text == null) {
        return;
    }
    if (!text) {
        element.innerHTML = `""`;
        element.setAttribute("data-value", "");
        return;
    }
    element.innerHTML = `"${text}"`;
    element.setAttribute("data-value", text);
}

function getElementFromDataType(type) {
    for (let child of massImportParseOrder.children) {
        if (child.getAttribute("data-type") === type) {
            return child;
        }
    }
}

function changeData(element, type) {
    element.setAttribute("data-type", type);
    switch (type) {
        case "hanzi":
            element.innerHTML = "Hanzi";
            element.style.backgroundColor = "#E76B79";
            break;
        case "pinyin":
            element.innerHTML = "Pinyin";
            element.style.backgroundColor = "#756BF4";
            break;
        case "meaning":
            element.innerHTML = "Meaning";
            element.style.backgroundColor = "#6CE579";
            break;
    }
}

function changeDataType(element) {
    var type = element.getAttribute("data-type");
    switch (type) {
        case "hanzi":
            var pinyin = getElementFromDataType("pinyin");
            changeData(pinyin, "hanzi");
            changeData(element, "pinyin");
            break;
        case "pinyin":
            var meaning = getElementFromDataType("meaning");
            changeData(meaning, "pinyin");
            changeData(element, "meaning");
            break;
        case "meaning":
            var hanzi = getElementFromDataType("hanzi");
            changeData(hanzi, "meaning");
            changeData(element, "hanzi");
            break;
    }
}

function splitInTwo(string, delim) {
    var stringSplit = string.split(delim);
    return [stringSplit[0], string.substring(stringSplit[0].length + delim.length)];
}

function formatChild(string) {
    return string.substring(1, string.length - 2);
}

function getDelims() {
    var result = [];
    result.push(massImportParseOrder.children[0].getAttribute("data-value"));
    result.push(massImportParseOrder.children[2].getAttribute("data-value"));
    result.push(massImportParseOrder.children[3].getAttribute("data-value"));
    result.push(massImportParseOrder.children[5].getAttribute("data-value"));
    result.push(massImportParseOrder.children[6].getAttribute("data-value"));
    result.push(massImportParseOrder.children[8].getAttribute("data-value"));
    return result;
}

function discard(string, delim) {
    if (delim.length === 0) {
        return string;
    }
    return splitInTwo(string, delim)[1];
}

//returns [value, string]
function readValue(string, delim1, delim2) {
    if (!delim1 && !delim2) {
        return [string, ""];
    }
    if (!delim1) {
        return splitInTwo(string, delim2);
    }
    if (!delim2) {
        return splitInTwo(string, delim1);
    }
    var split = splitInTwo(string, delim1);
    var splitAgain = splitInTwo(split[1], delim2);
    return [split[0], splitAgain[1]];
}

function validLine(line) {
    var delims = getDelims();
    for (let delim of delims) {
        if (!delim) {
            continue;
        }
        if (!line.includes(delim)) {
            return false;
        }
    }

    return true;
}

var importButton = document.getElementById("import-button");

importButton.onclick = function() {
    navigator.clipboard.readText().then(r => {
        var delims = getDelims();
        for (var line of r.split('\n')) {
            if (line.length === 0 || !validLine(line)) {
                //this line is useless, so skip
                continue;
            }

            var hanzi, pinyin, meaning;

            line = discard(line, delims[0]);
            //console.log("discard! string:\"" + line + "\"");
            var readVal1 = readValue(line, delims[1], delims[2]);
            //console.log("readval! string:\"" + readVal1[1] + "\", val:\"" + readVal1[0] + "\"");

            switch (massImportParseOrder.children[1].getAttribute("data-type")) {
                case "hanzi":
                    hanzi = readVal1[0];
                    break;
                case "pinyin":
                    pinyin = readVal1[0];
                    break;
                case "meaning":
                    meaning = readVal1[0];
                    break;
            }

            var readVal2 = readValue(readVal1[1], delims[3], delims[4]);
            //console.log("readval! string:\"" + readVal2[1] + "\", val:\"" + readVal2[0] + "\"");

            switch (massImportParseOrder.children[4].getAttribute("data-type")) {
                case "hanzi":
                    hanzi = readVal2[0];
                    break;
                case "pinyin":
                    pinyin = readVal2[0];
                    break;
                case "meaning":
                    meaning = readVal2[0];
                    break;
            }

            var readVal3 = readValue(readVal2[1], delims[5], "");
            //console.log("readval! string:\"" + readVal3[1] + "\", val:\"" + readVal3[0] + "\"");

            switch (massImportParseOrder.children[7].getAttribute("data-type")) {
                case "hanzi":
                    hanzi = readVal3[0];
                    break;
                case "pinyin":
                    pinyin = readVal3[0];
                    break;
                case "meaning":
                    meaning = readVal3[0];
                    break;
            }

            createNewTerm(hanzi, pinyin, meaning);
        }
    });
    //alert("Import successful :)");
}
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
        console.log("attr: " + child.getAttribute("data-index"));
        console.log("i: " + currentIndex);
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

formNew.onclick = () => {
    if (!validateForm()) {
        return;
    }

    var hanzi = formHanzi.value;
    var pinyin = convertPinyinTones(formPinyin.value);;
    var meaning = formMeaning.value;

    let newTerm = document.createElement("p");
    newTerm.innerText = hanzi + "; " + pinyin + "; " + meaning;
    newTerm.className = "create-item";
    newTerm.setAttribute("data-hanzi", hanzi);
    newTerm.setAttribute("data-pinyin", pinyin);
    newTerm.setAttribute("data-meaning", meaning);
    newTerm.setAttribute("data-index", termList.children.length);

    newTerm.onclick = () => {
        if (termList.children.length > currentIndex) {
            //last one
            termList.children[currentIndex].style.color = "black";
        }

        currentIndex = newTerm.getAttribute("data-index");
        formHanzi.value = newTerm.getAttribute("data-hanzi");
        formPinyin.value = newTerm.getAttribute("data-pinyin");
        formMeaning.value = newTerm.getAttribute("data-meaning");
        formNew.disabled = true;
        formEdit.disabled = false;
        formDelete.disabled = false;
        formCancel.disabled = false;
        newTerm.style.color = "red";

        for (var child of player.children) {
            if (child.getAttribute("data-index") == currentIndex) {
                recordPlay.disabled = false;
            }
        }
    }

    termList.append(newTerm);

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
}

formDelete.onclick = () => {
    formNew.disabled = false;
    formEdit.disabled = true;
    formDelete.disabled = true;
    formCancel.disabled = true;

    formHanzi.value = "";
    formPinyin.value = "";
    formMeaning.value = "";

    for (var child of player.children) {
        if (child.getAttribute("data-index") == currentIndex) {
            player.removeChild(child);
            break;
        }
    }

    termList.removeChild(termList.children[currentIndex]);
    for (var i = 0; i < termList.children.length; i++) {
        let previousIndex = termList.children[i].getAttribute("data-index");
        termList.children[i].setAttribute("data-index", i);

        //find and change sister audio index
        player.children.forEach((playerChild, playerChildIndex) => {
            if (playerChild.getAttribute("data-index") == previousIndex) {
                playerChild.setAttribute("data-index", i);
            }

            //remove orphaned audios
            if (playerChild.getAttribute("data-index") >= termList.children.length) {
                player.removeChild(playerChild);
            }
        });
    }
}

formCancel.onclick = () => {
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

openTest.onclick = () => {
    window.open("./test.html", '_blank').focus();
}

function generateWithBase64() {
    let blobs = new Map();
    let strings = new Map();
    let promises = [];

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

    Promise.allSettled(promises).then(() => {
        console.log("starting to fileread!");
        let counter = 0;
        for (let child of player.children) {
            let reader = new FileReader();
            reader.onload = () => {
                console.log(counter);
                counter++;
                strings.set(child.getAttribute("data-index"), reader.result);

                if (counter === player.children.length) {
                    console.log("create");
                    generateFile(strings);
                }
            }
            console.log(blobs);
            reader.readAsDataURL(blobs.get(child.getAttribute("data-index")));
        }
    })
}

finish.onclick = async function() {
    let regex = /^([a-zA-Z0-9]{4}-[a-zA-Z0-9]{4})$/;
    if (!regex.test(testValue.value)) {
        alert("Invalid test value!");
        return;
    }

    console.log("test");
    generateWithBase64();
}

function generateFile(blobs) {
    const result = {
        settings: {
            useAudio: useAudio.checked
        },
        terms: []
    }

    for (var child of termList.children) {
        var hanzi = child.getAttribute("data-hanzi");
        var pinyin = child.getAttribute("data-pinyin");
        var meaning = child.getAttribute("data-meaning");
        var index = child.getAttribute("data-index");

        if (blobs.has(index)) {
            result.terms.push({
                hanzi: hanzi,
                pinyin: pinyin,
                meaning: meaning,
                audio: blobs.get(index)
            });
        }
        else {
            result.terms.push({
                hanzi: hanzi,
                pinyin: pinyin,
                meaning: meaning,
                audio: null
            });
        }
    }

    save("test.plang", JSON.stringify(result));
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
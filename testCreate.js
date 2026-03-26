let buttons = [];

let mainContainer = document.getElementById("main");

var index = 0;
for (let child of mainContainer.children) {
    if (index === 5) {
        //don't read 6th child
        break;
    }
    buttons.push(child.getElementsByTagName("button"));
    index++;
}

function setAll(start, stop, play, exceptI, startI, stopI, playI) {
    for (var i = 0; i < 5; i++) {
        if (i === exceptI) {
            buttons[i][0].disabled = startI;
            buttons[i][1].disabled = stopI;
            buttons[i][2].disabled = playI;
        }
        else {
            buttons[i][0].disabled = start;
            buttons[i][1].disabled = stop;
            buttons[i][2].disabled = play;
        }
        
    }
}

function startButton(index) {
    setAll(true, true)
}
function stopButton(index) {
    
}
function playButton(index) {
    
}
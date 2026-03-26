class audioHanzi {
    init(position) { //done
        let writer = HanziWriter.create("character", position.sessions[0].hanzi.charAt(0), {
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

        let demonstration = HanziWriter.create("demonstration", position.sessions[0].hanzi.charAt(0), {
            width: 200,
            height: 200,
            padding: 5,
            showOutline: false,
            strokeAnimationSpeed: 2,
            delayBetweenStrokes: 10,
            strokeColor: "#000"
        });

        let challenge = HanziWriter.create("challenge", position.sessions[0].hanzi.charAt(0), {
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

        document.getElementById("audio-hanzi").setAttribute("data-index", position.sessions[0].id);
        document.getElementById("stroke-order").onclick = () => {
            demonstration.animateCharacter();
        }

        position.writer = writer;
        position.demonstration = demonstration;
        position.challenge = challenge;

        position.root.switchArea([document.getElementById("audio-hanzi"), bottomMenu, positionText, timeMessage]);
        position.root.shuffle(position.sessions);
        position.root.updatePosition(position);

        currentAudioElement.play();
        
        this.nextChar(position);
    }

    nextTerm(position) { //done
        position.writeIndex = 0;
        currentAudioElement.play();
        this.nextChar(position);
    }

    nextChar(position) {
        console.log("next char!");
        console.log(position);

        document.getElementById("audio-hanzi").setAttribute("data-index", position.sessions[position.sessionIndex].id);
        //skip re-rendering if term is one character and the character has alreay been rendered
        if (position.sessions[position.sessionIndex].hanzi.length === 1) {
            if (position.writesLeft === position.writesForRound) {
                position.writer.setCharacter(position.sessions[position.sessionIndex].hanzi.charAt(position.writeIndex));
                position.demonstration.setCharacter(position.sessions[position.sessionIndex].hanzi.charAt(position.writeIndex));
            }
        }
        else {
            position.writer.setCharacter(position.sessions[position.sessionIndex].hanzi.charAt(position.writeIndex));
            position.demonstration.setCharacter(position.sessions[position.sessionIndex].hanzi.charAt(position.writeIndex));
        }

        position.writer.quiz({
            onComplete: () => {
                if (position.sessions[position.sessionIndex].hanzi.length === position.writeIndex + 1) {
                    //done with write, move onto next write
                    position.root.nextTerm(position);
                }
                else {
                    //continue write
                    position.writeIndex++;
                    this.nextChar(position);
                }
            }
        });
    }

    challengeChar(position) { //done
        position.challenge.setCharacter(position.sessions[position.sessionIndex].hanzi.charAt(position.writeIndex));
        let challengeDone = {
            status: false,
            ms: position.goalForRound * 1000
        }

        position.root.startCountdown(challengeDone).then((passed) => {
            if (passed) {
                console.log("passed char: " + position.sessions[position.sessionIndex].hanzi.charAt(position.writeIndex));
                position.writeIndex++;
                if (position.sessions[position.sessionIndex].hanzi.length === position.writeIndex) {
                    //done with challenge!
                    position.writeIndex = 0;
                    position.root.switchArea([document.getElementById("audio-hanzi"), bottomMenu, positionText, timeMessage]);
                    position.root.updatePosition(position);
                    position.root.nextSession(position);
                }
                else {
                    //continue to next challenge char
                    this.challengeChar(position);
                }
            }
            else {
                console.log("failed");
                position.root.updateMessageWithOffset(position.writesForRound);

                //redo last session
                position.sessionIndex--;
                position.root.updatePosition(position);
                position.root.nextSession(position);
            }
        });

        position.challenge.quiz({
            onComplete: () => {
                challengeDone.status = true;
            }
        });
    }

    nextChallenge(position) { //done
        position.writeIndex = 0;
        currentAudioElement.play();

        this.challengeChar(position);
    }

    changeColor(position, color) { //done
        position.writer.updateColor("strokeColor", color);
        position.demonstration.updateColor("strokeColor", color);
    }

    modeDone() { //done
        console.log("audio hanzi done!!!");
    }
}
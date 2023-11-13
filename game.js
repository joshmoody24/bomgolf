var bomverses;
var book;
var chapter;
var verse;

var gameWindow;
var bookButtons;
var verseBox;
var chapterInputPanel;
var bookInputPanel;
var startGamePanelOuter;
var startGamePanelInner;
var isInRound;

//settings variables
var settingsWindow;
var closeSettingsButton;
var verseCheckBox;
var hintsBox;

//health variables
var incrementHealthButton;
var decrementHealthButton;
var maxHealthDisplay;
var maxhp;
const maxhplimit = 9;
const defaultHealth = 5;
var hp;
var healthDisplay;

//audio
var successSound = new Audio("./sfx/success.mp3");
var wrongSound = new Audio("./sfx/wrong.mp3");
var tapSound = new Audio("./sfx/tap-3.mp3");
var swooshSound = new Audio("./sfx/swoosh.mp3");
var wrongSound2 = new Audio("./sfx/wrong-2.mp3");
var bgmCheckBox;
var sfxCheckBox;
var bgmPlayer;

var originalButtonColor;

var numChapters = {
    "1 Nephi": 22,
    "2 Nephi": 33,
    "Jacob": 7,
    "Enos": 1,
    "Jarom": 1,
    "Omni": 1,
    "Words of Mormon": 1,
    "Mosiah": 29,
    "Alma": 63,
    "Helaman": 16,
    "3 Nephi": 30,
    "4 Nephi": 1,
    "Mormon": 9,
    "Ether": 15,
    "Moroni": 10,
}

function gameSetup(){
    //load the BOM data
    loadJSON(function(response) {
        // Parsing JSON string into object
          bomverses = JSON.parse(response);
    });
    
    //initialize variables
    gameWindow = document.getElementById('gamewindow');
    bookButtons = document.getElementsByClassName('BookButton');
    verseBox = document.getElementById("versebox");
    chapterInputPanel = document.getElementById("chapterinput");
    bookInputPanel = document.getElementById("bookinput");
    startGamePanelOuter = document.getElementById("startgamepanel-outer");
    startGamePanelInner = document.getElementById("startgamepanel-inner");
    originalButtonColor = document.getElementById("newgamebutton").style.backgroundColor;

    //settings
    settingsWindow = document.getElementById("settings");
    closeSettingsButton = document.getElementById("closesettingsbutton");
    window.addEventListener("resize",onScreenResize);
    verseCheckBox = document.getElementById("versenumberbox");
    hintsBox = document.getElementById("hintsbox");

    //health
    incrementHealthButton = document.getElementById('incrementhealthbutton');
    decrementHealthButton = document.getElementById('decrementhealthbutton');
    maxHealthDisplay = document.getElementById('maxhealthdisplay');
    maxhp = defaultHealth;
    healthDisplay = document.getElementById('gamelog');

    //audio
    sfxCheckBox = document.getElementById("sfxbox");
    bgmCheckBox = document.getElementById("bgmbox");
    bgmPlayer = document.getElementById("bgmPlayer");

    console.log("Game Loaded");
}

function loadJSON(callback) {   

    var xobj = new XMLHttpRequest();
        xobj.overrideMimeType("application/json");
    xobj.open('GET', './bomdata.json', true); // Replace 'appDataServices' with the path to your file
    xobj.onreadystatechange = function () {
          if (xobj.readyState == 4 && xobj.status == "200") {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
            callback(xobj.responseText);
          }
    };
    xobj.send(null);  
 }

function newGame(firstLoad=false){
    if(!firstLoad){
        gtag('event', 'click', {
            category: 'button',
            label: 'Restart',
        });
    }
    //if the browser blocked auto play audio
    if(bgmPlayer?.paused){
        bgmCheckBox.checked = false;
    }
    hp = maxhp;
    healthDisplay.innerHTML = "Health: " + hp;
    //todo: make this function easier to understand
    resetButtons(bookButtons);
    updateVerse();
    //todo: learn more about display types
    bookInputPanel.style.display = 'grid';
    chapterInputPanel.style.display = 'none';
    startGamePanelInner.style.display = 'none';
    startGamePanelOuter.style.display = 'none';
    gameWindow.className = 'gamewindow mainwindow';
    isInRound = false;
    //remove all the buttons generated from the chapter input box
    chapterButton = chapterInputPanel.lastElementChild;
    while(chapterButton){
        chapterInputPanel.removeChild(chapterButton);
        chapterButton = chapterInputPanel.lastElementChild;
    }
}

function disableButtons(buttons, active){
    for(var i = 0; i < buttons.length; i++){
        buttons[i].disabled = active;
    }
}

function disableChapterButtons(){
    //disable all chapter buttons
    for(i = 1; i <= numChapters[book];i++){
        cButton = document.getElementById("ChapterButton"+i);
        if(cButton != null){
            cButton.disabled = true;
        }
    }
}

function resetButtons(buttons){
    disableButtons(buttons, false);
    //reset styles
    for(var i = 0; i < buttons.length; i++){
        buttons[i].style.backgroundColor = originalButtonColor;
    }
}

function updateVerse(){
    playSound(swooshSound);
    var newReference = pickRandomVerse();
    //record the solution
    newReference = newReference.split(':');
    verse = newReference[1];
    newReference = newReference[0].split(' ');
    if(newReference.length == 3){
        book = newReference[0] + ' ' + newReference[1];
        chapter = newReference[2];
    }
    else if(newReference.length == 2){
        book = newReference[0];
        chapter = newReference[1];
    }
    //this only triggers for WOM
    else{
        book = "Words of Mormon";
        chapter = 1;
        console.log("Hit the rare case! WoM.");
    }
    //displays or hides verses based on checkbox
    updateVerseDisplay();
    console.log("new book: " + book + "\nnew chapter: " + chapter);
}

function pickRandomVerse(){
    //guaranteed to be random
    var keys = Object.keys(bomverses);
    var randIndex = Math.floor(Math.random() * keys.length);
    return keys[randIndex];
}

function testBook(bookName){
    gtag('event', 'click', {
        category: 'button',
        label: 'Book: ' + bookName,
    });
    playSound(tapSound);
    var currentButton = document.getElementById(bookName)
    if(isInRound == false){
        beginRound();
    }
    //if correct guess
    if(bookName == book){
        disableButtons(bookButtons, true);
        currentButton.style.backgroundColor = 'var(--right-guess-color';
        //toggle over to the chapter input panel and populate with the proper number of verses
        chapterInputPanel.style.display = 'grid';
        bookInputPanel.style.display = 'none';
        for(var i = 1; i <= numChapters[bookName]; i++){
            var newButton = document.createElement('button');
            newButton.innerHTML = i;
            newButton.id = "ChapterButton" + i;
            newButton.className = "gamebutton chapterbutton";
            newButton.value = i;
            try{
                //old version that doesn't work on IOS
                //pretty hacky but it works. J is a mouse event and it is tracked through the DOM to the correct button. innerHTML is casted to int.
                //newButton.onclick = function(j){
                //   testChapter(j.path[0].innerHTML);
                //}

                //wow, this is embarrasing, the keyword "this" is all I needed the whole time
                newButton.onclick = function(){
                    testChapter(this.value);
                }
            }
            catch(err){
                healthDisplay.innerHTML = "Error: " + err.name;
            }
            finally{
                chapterInputPanel.appendChild(newButton);
            }
        }
    }
    else{
        currentButton.disabled = true;
        currentButton.style.backgroundColor = 'var(--wrong-guess-color';
        loseHealth();
    }
}

//triggers when a player first clicks on a verse after starting a new game
function beginRound(){
    isInRound = true;
}

function testChapter(i){
    try{
        gtag('event', 'click', {
            category: 'button',
            label: 'Chapter: ' + book + ' ' + chapter,
        });
        //make sure i is an integer, not a string
        i = parseInt(i);
        playSound(tapSound);
        currentButton = document.getElementById("ChapterButton"+i);
        if(i == chapter){
            currentButton.style.backgroundColor = 'var(--right-guess-color';
            disableChapterButtons();
            win();
        }
        else{
            //if hints are turned on, disable the buttons above or below guess that don't contain the right answer
            if(hintsBox.checked){
                if(i < chapter){
                    for(var j = 1; j < i; j++){
                        document.getElementById("ChapterButton"+j).disabled = true;
                    }
                }
                else{
                    for(var j = i+1; j <= numChapters[book]; j++){
                        document.getElementById("ChapterButton"+j).disabled = true;
                    }
                }
            }
            currentButton.disabled = true;
            currentButton.style.backgroundColor = 'var(--wrong-guess-color';
            loseHealth();
        }
    }
    catch(err){
        healthDisplay.innerHTML = err.name + err.message;
    }
}

//health functions
function incrementMaxHealth(){
    playSound(tapSound);
    if(maxhp < maxhplimit){
        maxhp++;
        maxHealthDisplay.innerHTML = maxhp;
    }
    if(!isInRound){
        hp = maxhp;
        healthDisplay.innerHTML = "Health: " + hp;
    }
}
function decrementMaxHealth(){
    playSound(tapSound);
    if(maxhp > 1){
        maxhp--;
        maxHealthDisplay.innerHTML = maxhp;
    }
    if(!isInRound){
        hp = maxhp;
        healthDisplay.innerHTML = "Health: " + hp;
    }
}
function loseHealth(){
    playSound(wrongSound);
    if(hp > 1){
        hp--;
        healthDisplay.innerHTML = "Health: " + hp;
    }
    else{
        gameOver();
    }
}
function gameOver(){
    gtag('event', 'game_complete', {
        success: false,
        hints: hintsBox.checked,
        misses: maxhp - hp,
    });
    healthDisplay.innerHTML = "<p>Game Over</p><p>Correct answer: " + book + " " + chapter + "</p>";
    disableButtons(bookButtons, true);
    disableChapterButtons();
    playSound(wrongSound2);
}
function win(){
    gtag('event', 'game_complete', {
        success: true,
        hints: hintsBox.checked,
        misses: maxhp - hp,
    });
    healthDisplay.innerHTML = "You Win!";
    playSound(successSound);
}

function showSettings(){
    settingsWindow.style.display = "block";
    closeSettingsButton.style.display = "block"
    playSound(tapSound);
}
function hideSettings(){
    settingsWindow.style.display = "none";
    closeSettingsButton.style.display = "none";
    playSound(tapSound);
}

function playSound(audio){
    if(sfxCheckBox.checked){
        audio.currentTime = 0;
        audio.play();
    }
}

function onToggleSfx(newState){
    gtag('event', 'audio', {
        category: 'sfx',
        label: newState ? 'on' : 'off',
    });
}

function toggleBGM(){
    if(bgmCheckBox.checked){
        bgmPlayer.play();
        gtag('event', 'audio', {
            category: 'bgm',
            label: 'play',
        });
    }
    else{
        bgmPlayer.pause();
        gtag('event', 'audio', {
            category: 'bgm',
            label: 'stop',
        });
    }
}

function updateVerseDisplay(){
    if(verseCheckBox.checked){
        verseBox.innerHTML = bomverses[book + " " + chapter + ":" + verse];
    }
    else{
        if(verse > 9){
            verseBox.innerHTML = bomverses[book + " " + chapter + ":" + verse].substring(3);
        }
        else{
            verseBox.innerHTML = bomverses[book + " " + chapter + ":" + verse].substring(2);
        }
    }
}

//auto-reveal settings window if the screen is resized to desktop size
function onScreenResize(){
    if(window.innerWidth > 992){
        console.log("screen size changed to " + window.innerWidth + ", making the settings window visible");
        settingsWindow.style.display = "block";
        closeSettingsButton.style.display = "none";
    }
    else{
        settingsWindow.style.display = "none";
    }
}

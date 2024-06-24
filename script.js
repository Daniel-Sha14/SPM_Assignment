// script.js

document.getElementById("new-arcade-game").addEventListener("click", () => {
    window.location.href = "html/arcade-game.html"; 
});

document.getElementById("new-free-play-game").addEventListener("click", () => {
    window.location.href = "html/freePlay.html";
});

document.getElementById("load-saved-game").addEventListener("click", () => {
    alert("Load Saved Game placeholder");
});

document.getElementById("display-high-scores").addEventListener("click", () => {
    alert("Display High Scores placeholder");
});

document.getElementById("exit-game").addEventListener("click", () => {
    window.location.href = "https://www.google.com";
});

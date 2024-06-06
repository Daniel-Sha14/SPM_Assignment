document.getElementById("new-arcade-game").addEventListener("click", () => {
    // Start a new Arcade game
    window.location.href = "arcade-game.html"; // Example redirection to Arcade game page
});

document.getElementById("new-free-play-game").addEventListener("click", () => {
    // Start a new Free Play game
    window.location.href = "free-play-game.html"; // Example redirection to Free Play game page
});

document.getElementById("load-saved-game").addEventListener("click", () => {
    // Load saved game logic here
    alert("Load Saved Game clicked");
});

document.getElementById("display-high-scores").addEventListener("click", () => {
    // Display high scores logic here
    alert("Display High Scores clicked");
});

document.getElementById("exit-game").addEventListener("click", () => {
    // Exit game logic here
    window.close(); // This will only work for web applications run in a controlled environment
});

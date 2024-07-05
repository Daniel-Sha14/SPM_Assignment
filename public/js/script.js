// script.js

const mainMenu = document.getElementById('main-menu');
const saveGameSelection = document.getElementById('save-game-selection');
const saveGameContainer = document.getElementById('save-game-container');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');

const saveGames = [
    { id: 1, coins: 1000, points: 5000, date: '2024-07-01', gameType: 'Free-Play'},
    { id: 2, coins: 1500, points: 7500, date: '2024-07-02', gameType: 'Free-Play' },
    { id: 3, coins: 2000, points: 10000, date: '2024-07-03', gameType: 'arcade' },
    { id: 4, coins: 2500, points: 12500, date: '2024-07-04', gameType: 'arcade' },
    { id: 5, coins: 3000, points: 15000, date: '2024-07-05', gameType: 'arcade' },
    { id: 6, coins: 3500, points: 17500, date: '2024-07-06', gameType: 'arcade' },
];

let currentPage = 0;
const gamesPerPage = 3;

function createSaveGameCard(game) {
    const card = document.createElement('div');
    card.className = 'save-game-card';
    card.innerHTML = `
        <h3>Save Game ${game.id}</h3>
        <div class="card-image"></div>
        <div class="card-content">
        <p>Mode: ${game.gameType}</p>
            <p>Coins: ${game.coins}</p>
            <p>Points: ${game.points}</p>
            <p>Date: ${game.date}</p>
        </div>
    `;
    card.addEventListener('click', () => loadSaveGame(game.id));
    return card;
}

function displaySaveGames() {
    saveGameContainer.innerHTML = '';
    const startIndex = currentPage * gamesPerPage;
    const endIndex = startIndex + gamesPerPage;
    const visibleGames = saveGames.slice(startIndex, endIndex);
    
    visibleGames.forEach((game, index) => {
        const card = createSaveGameCard(game);
        card.style.animationDelay = `${index * 0.1}s`;
        saveGameContainer.appendChild(card);
    });

    prevPageBtn.disabled = currentPage === 0;
    nextPageBtn.disabled = endIndex >= saveGames.length;
}

function showSaveGameSelection() {
    mainMenu.classList.add('hidden');
    saveGameSelection.classList.remove('hidden');
    saveGameSelection.style.animation = 'slideIn 0.5s ease-out';
    displaySaveGames();
}

function hideSaveGameSelection() {
    saveGameSelection.classList.add('hidden');
    mainMenu.classList.remove('hidden');
    mainMenu.style.animation = 'slideIn 0.5s ease-out';
}

function loadSaveGame(id) {
    console.log(`Loading save game ${id}`);
    // Implement your load game logic here
    hideSaveGameSelection();
}

// Event Listeners
document.getElementById('new-arcade-game').addEventListener('click', () => {
    window.location.href = '../html/arcade-game.html';
});

document.getElementById('new-free-play-game').addEventListener('click', () => {
    window.location.href = '../html/freePlay.html';
});

document.getElementById('load-saved-game').addEventListener('click', showSaveGameSelection);

document.getElementById('display-high-scores').addEventListener('click', () => {
    alert('Display High Scores placeholder');
});

document.getElementById('exit-game').addEventListener('click', () => {
    window.location.href = 'https://www.google.com';
});

prevPageBtn.addEventListener('click', () => {
    if (currentPage > 0) {
        currentPage--;
        displaySaveGames();
    }
});

nextPageBtn.addEventListener('click', () => {
    if ((currentPage + 1) * gamesPerPage < saveGames.length) {
        currentPage++;
        displaySaveGames();
    }
});

// Add a return to menu button
const returnToMenuBtn = document.createElement('button');
returnToMenuBtn.textContent = 'Return to Menu';
returnToMenuBtn.className = 'button';
returnToMenuBtn.addEventListener('click', hideSaveGameSelection);
saveGameSelection.appendChild(returnToMenuBtn);

document.getElementById('music-control').addEventListener('click', function() {
    var audio = document.getElementById('background-music');
    if (audio.paused) {
        audio.play().then(function() {
            document.getElementById('music-control').textContent = '🔊';
        }).catch(function(error) {
            console.log('Error playing audio:', error);
        });
    } else {
        audio.pause();
        document.getElementById('music-control').textContent = '🔇';
    }
});
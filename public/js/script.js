document.addEventListener('DOMContentLoaded', () => {
    const mainMenu = document.getElementById('main-menu');
    const saveGameSelection = document.getElementById('save-game-selection');
    const saveGameContainer = document.getElementById('save-game-container');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const loginButton = document.getElementById('login');
    const exitGameButton = document.getElementById('exit-game');
    const newArcadeGameBtn = document.getElementById('new-arcade-game');
    const newFreePlayGameBtn = document.getElementById('new-free-play-game');
    const loadSavedGameBtn = document.getElementById('load-saved-game');
    const displayHighScoresBtn = document.getElementById('display-high-scores');
    const returnToMenuBtn = document.createElement('button');
    const musicControl = document.getElementById('music-control');
    const audio = document.getElementById('background-music');

    let saveGames = [];
    let currentPage = 0;
    const gamesPerPage = 5;

    // Initial state setup
    if (localStorage.getItem('token')) {
        setLoggedInState();
    }

    returnToMenuBtn.textContent = 'Return to Menu';
    returnToMenuBtn.className = 'button';
    saveGameSelection.appendChild(returnToMenuBtn);

    function fetchSaveGames() {
        const token = localStorage.getItem('token');
        if (!token) {
            return Promise.reject('No token found');
        }

        return fetch('/get-games', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch saved games');
            }
            return response.json();
        })
        .then(data => {
            saveGames = data.games.map(game => ({
                ...game,
                date: new Date(game.date)
            })).sort((a, b) => b.date - a.date);
            displaySaveGames();
        })
        .catch(error => console.error('Error fetching saved games:', error));
    }

    function formatDateString(date) {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function createSaveGameCard(game, index) {
        const card = document.createElement('div');
        card.className = 'save-game-card';
        card.dataset = {
            gameId: game.id,
            gridSize: game.gridSize,
            buildingsGrid: JSON.stringify(game.buildingsGrid),
            points: game.points,
            coins: game.coins === -1 ? Infinity : game.coins,
            turnNumber: game.turnNumber,
            gameMode: game.gameMode
        };

        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        renderGridOnCanvas(canvas, game.buildingsGrid, game.gridSize);

        card.innerHTML = `
            <h3>Save Game ${index + 1}</h3>
            <div class="card-image"></div>
            <div class="card-content">
                <p>Mode: ${game.gameMode}</p>
                <p>Coins: ${game.coins}</p>
                <p>Points: ${game.points}</p>
                <p>Date: ${formatDateString(game.date)}</p>
                <p>Turn Number: ${game.turnNumber}</p>
            </div>
        `;
        card.querySelector('.card-image').appendChild(canvas);
        card.addEventListener('click', () => loadSaveGame(card));
        return card;
    }

    function renderGridOnCanvas(canvas, buildingsGrid, gridSize) {
        const ctx = canvas.getContext('2d');
        const cellSize = canvas.width / gridSize;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;

        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const buildingType = buildingsGrid[row][col];
                ctx.strokeRect(col * cellSize, row * cellSize, cellSize, cellSize);
                if (buildingType) {
                    ctx.font = `${cellSize * 0.8}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = 'white';
                    ctx.fillText(getBuildingIcon(buildingType), col * cellSize + cellSize / 2, row * cellSize + cellSize / 2);
                }
            }
        }
    }

    function getBuildingIcon(buildingType) {
        const icons = {
            residential: 'R',
            industry: 'I',
            commercial: 'C',
            park: 'O',
            road: '*'
        };
        return icons[buildingType] || '';
    }

    function loadSaveGame(card) {
        const gameData = {
            gameId: card.dataset.gameId,
            gridSize: card.dataset.gridSize,
            buildingsGrid: JSON.parse(card.dataset.buildingsGrid),
            points: card.dataset.points,
            coins: card.dataset.coins,
            turnNumber: card.dataset.turnNumber,
            gameMode: card.dataset.gameMode
        };
        localStorage.setItem('loadedGame', JSON.stringify(gameData));
        const gamePage = gameData.gameMode === 'arcade' ? '../html/arcade-game.html' : '../html/freePlay.html';
        window.location.href = gamePage;
    }

    function createPlaceholderCard() {
        const card = document.createElement('div');
        card.className = 'save-game-card placeholder';
        card.innerHTML = `
            <h3>No Save Game</h3>
            <div class="card-image"></div>
            <div class="card-content">
                <p>Mode: -</p>
                <p>Coins: -</p>
                <p>Points: -</p>
                <p>Date: -</p>
                <p>Turn Number: -</p>
            </div>
        `;
        return card;
    }

    function displaySaveGames() {
        saveGameContainer.innerHTML = '';
        const startIndex = currentPage * gamesPerPage;
        const endIndex = startIndex + gamesPerPage;
        const visibleGames = saveGames.slice(startIndex, endIndex);

        visibleGames.forEach((game, index) => {
            const card = createSaveGameCard(game, startIndex + index);
            card.style.animationDelay = `${index * 0.1}s`;
            saveGameContainer.appendChild(card);
        });

        while (saveGameContainer.childElementCount < gamesPerPage) {
            const placeholderCard = createPlaceholderCard();
            saveGameContainer.appendChild(placeholderCard);
        }

        prevPageBtn.disabled = currentPage === 0;
        nextPageBtn.disabled = endIndex >= saveGames.length;
    }

    function showSaveGameSelection() {
        mainMenu.classList.add('hidden');
        saveGameSelection.classList.remove('hidden');
        saveGameSelection.style.animation = 'slideIn 0.5s ease-out';
        fetchSaveGames();
    }

    function hideSaveGameSelection() {
        saveGameSelection.classList.add('hidden');
        mainMenu.classList.remove('hidden');
        mainMenu.style.animation = 'slideIn 0.5s ease-out';
    }

    function handleLoginLogout() {
        if (localStorage.getItem('token')) {
            handleLogout();
        } else {
            window.location.href = '../html/login.html';
        }
    }

    function handleLogout() {
        localStorage.removeItem('token');
        alert('Logged out successfully');
        setLoggedOutState();
    }

    function setLoggedInState() {
        loginButton.textContent = 'Logout';
    }

    function setLoggedOutState() {
        loginButton.textContent = 'Login';
    }

    function checkAuth() {
        return !!localStorage.getItem('token');
    }

    function handleAuthenticatedAction(action) {
        if (checkAuth()) {
            switch (action) {
                case 'arcade':
                    window.location.href = '../html/arcade-game.html';
                    break;
                case 'freeplay':
                    window.location.href = '../html/freePlay.html';
                    break;
                case 'load':
                    showSaveGameSelection();
                    break;
                case 'highscores':
                    window.location.href = '../html/highscores.html';
                    break;
            }
        } else {
            showAuthAlert();
        }
    }

    function showAuthAlert() {
        const alertHtml = `
            <div id="auth-alert" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            ">
                <div style="
                    background: var(--card-bg-color);
                    border: 2px solid var(--primary-color);
                    border-radius: 10px;
                    padding: 2rem;
                    text-align: center;
                    max-width: 700px;
                    width: 90%;
                ">
                    <h2 style="color: var(--primary-color);">Authentication Required</h2>
                    <p>Please log in to access this feature.</p>
                    <div style="margin-top: 1rem;">
                        <button id="auth-alert-cancel" class="button" style="margin-right: 1rem;">Cancel</button>
                        <button id="auth-alert-login" class="button">Log In</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', alertHtml);

        document.getElementById('auth-alert-cancel').addEventListener('click', () => {
            document.getElementById('auth-alert').remove();
        });

        document.getElementById('auth-alert-login').addEventListener('click', () => {
            document.getElementById('auth-alert').remove();
            handleLoginLogout();
        });
    }

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

    loginButton.addEventListener('click', handleLoginLogout);
    exitGameButton.addEventListener('click', () => alert('Exiting game...'));
    newArcadeGameBtn.addEventListener('click', () => handleAuthenticatedAction('arcade'));
    newFreePlayGameBtn.addEventListener('click', () => handleAuthenticatedAction('freeplay'));
    loadSavedGameBtn.addEventListener('click', () => handleAuthenticatedAction('load'));
    displayHighScoresBtn.addEventListener('click', () => handleAuthenticatedAction('highscores'));
    returnToMenuBtn.addEventListener('click', hideSaveGameSelection);

    // Music control
    
});

// index.js

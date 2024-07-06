document.addEventListener('DOMContentLoaded', () => {
    const mainMenu = document.getElementById('main-menu');
    const saveGameSelection = document.getElementById('save-game-selection');
    const saveGameContainer = document.getElementById('save-game-container');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');

    // Game state
    let saveGames = [];
    let currentPage = 0;
    const gamesPerPage = 5;

    // Fetch save games from the server
    async function fetchSaveGames() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No token found');
            }

            const response = await fetch('/get-games', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch saved games');
            }

            const data = await response.json();
            saveGames = data.games.map(game => ({
                ...game,
                date: new Date(game.date)
            }));
            saveGames.sort((a, b) => b.date - a.date); // Sort by date, newest first
            displaySaveGames();
        } catch (error) {
            console.error('Error fetching saved games:', error);
        }
    }

    // Format date for display
    function formatDateString(date) {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Create a card for a save game
    function createSaveGameCard(game, index) {
        const card = document.createElement('div');
        card.className = 'save-game-card';
        if (game.coins === -1) {
            game.coins = Infinity;
        }

        // Add data attributes for the game data
        card.dataset.gameId = game.id;
        card.dataset.gridSize = game.gridSize;
        card.dataset.buildingsGrid = JSON.stringify(game.buildingsGrid);
        card.dataset.points = game.points;
        card.dataset.coins = game.coins;
        card.dataset.turnNumber = game.turnNumber;
        card.dataset.gameMode = game.gameMode;

        // Create a canvas element to render the grid
        const canvas = document.createElement('canvas');
        canvas.width = 200; // Fixed width
        canvas.height = 200; // Adjust height to fit card size
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
        card.querySelector('.card-image').appendChild(canvas); // Append canvas to card-image div
        card.addEventListener('click', () => loadSaveGame(card)); // Pass the card itself to loadSaveGame
        return card;
    }

    // Render the grid state on a canvas
    function renderGridOnCanvas(canvas, buildingsGrid, gridSize) {
        const ctx = canvas.getContext('2d');
        const cellSize = canvas.width / gridSize; // Dynamically calculate cell size to fit canvas

        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw the grid
        ctx.strokeStyle = 'white'; // Set grid lines color to white
        ctx.lineWidth = 1; // Set line width for better visibility

        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const buildingType = buildingsGrid[row][col];
                ctx.strokeRect(col * cellSize, row * cellSize, cellSize, cellSize); // Draw grid cell borders

                if (buildingType) {
                    ctx.font = `${cellSize * 0.8}px Arial`; // Set font size relative to cell size
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = 'white'; // Text color set to white

                    const centerX = col * cellSize + cellSize / 2;
                    const centerY = row * cellSize + cellSize / 2;
                    ctx.fillText(getBuildingIcon(buildingType), centerX, centerY);
                }
            }
        }
    }

    // Get icon for building types
    function getBuildingIcon(buildingType) {
        switch (buildingType) {
            case 'residential': return 'R';
            case 'industry': return 'I';
            case 'commercial': return 'C';
            case 'park': return 'O';
            case 'road': return '*';
            default: return '';
        }
    }

    // Load a save game
    function loadSaveGame(card) {
        console.log(card);
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
        console.log('Loaded game data:', gameData);

        if (gameData.gameMode === 'arcade') {
            window.location.href = '../html/arcade-game.html';
        } else {
            window.location.href = '../html/freePlay.html';
        }
    }

    // Create a placeholder card when there's no save game
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

    // Display save games
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

        for (let i = visibleGames.length; i < gamesPerPage; i++) {
            const placeholderCard = createPlaceholderCard();
            saveGameContainer.appendChild(placeholderCard);
        }

        prevPageBtn.disabled = currentPage === 0;
        nextPageBtn.disabled = endIndex >= saveGames.length;
    }

    // Show save game selection screen
    function showSaveGameSelection() {
        mainMenu.classList.add('hidden');
        saveGameSelection.classList.remove('hidden');
        saveGameSelection.style.animation = 'slideIn 0.5s ease-out';
        fetchSaveGames();
    }

    // Hide save game selection screen
    function hideSaveGameSelection() {
        saveGameSelection.classList.add('hidden');
        mainMenu.classList.remove('hidden');
        mainMenu.style.animation = 'slideIn 0.5s ease-out';
    }

    

    // Main event listener
    const loginButton = document.getElementById('login');
    const exitGameButton = document.getElementById('exit-game');

    // Check if the user is already logged in
    if (localStorage.getItem('token')) {
        setLoggedInState();
    }

    loginButton.addEventListener('click', handleLoginLogout);

    function handleLoginLogout() {
        if (localStorage.getItem('token')) {
            handleLogout();
        } else {
            window.location.href = '../html/lgin.html'; // Adjust the path to your login page
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

    exitGameButton.addEventListener('click', () => {
        // Add your exit game logic here
        alert('Exiting game...');
    });

    // Button elements
    const newArcadeGameBtn = document.getElementById('new-arcade-game');
    const newFreePlayGameBtn = document.getElementById('new-free-play-game');
    const loadSavedGameBtn = document.getElementById('load-saved-game');
    const displayHighScoresBtn = document.getElementById('display-high-scores');

    // Event listeners for main menu buttons
    newArcadeGameBtn.addEventListener('click', () => handleAuthenticatedAction('arcade'));
    newFreePlayGameBtn.addEventListener('click', () => handleAuthenticatedAction('freeplay'));
    loadSavedGameBtn.addEventListener('click', () => handleAuthenticatedAction('load'));
    displayHighScoresBtn.addEventListener('click', () => handleAuthenticatedAction('highscores'));

    // Event listeners for pagination
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

    // Authentication check
    function checkAuth() {
        const token = localStorage.getItem('token');
        return !!token;
    }

    // Handle authenticated actions
    function handleAuthenticatedAction(action) {
        if (checkAuth()) {
            switch(action) {
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
                    alert('Display High Scores placeholder');
                    break;
            }
        } else {
            showAuthAlert();
        }
    }

    // Show authentication alert
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

    // Fetch and display games on initial load only if user is authenticated
    if (checkAuth()) {
        fetchSaveGames();
    }

    // Music control
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
});

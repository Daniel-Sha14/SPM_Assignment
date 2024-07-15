document.addEventListener('DOMContentLoaded', () => {
    const highScoresContainer = document.getElementById('high-scores-container');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const returnToMenuBtn = document.getElementById('return-to-menu');

    let highScores = [];
    let currentPage = 0;
    const scoresPerPage = 3; 

    function setupEventListeners() {
        prevPageBtn.addEventListener('click', handlePrevPage);
        nextPageBtn.addEventListener('click', handleNextPage);
        searchButton.addEventListener('click', searchHighScores);
        searchInput.addEventListener('keypress', handleSearchKeypress);
        returnToMenuBtn.addEventListener('click', handleReturnToMenu);
    }

    function removeEventListeners() {
        prevPageBtn.removeEventListener('click', handlePrevPage);
        nextPageBtn.removeEventListener('click', handleNextPage);
        searchButton.removeEventListener('click', searchHighScores);
        searchInput.removeEventListener('keypress', handleSearchKeypress);
        returnToMenuBtn.removeEventListener('click', handleReturnToMenu);
    }

    async function fetchHighScores() {
        try {
            const response = await fetch('/get-high-scores', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();
            console.log(data);
            if (data.status === 'success') {
                highScores = data.highScores;
                displayHighScores();
            } else {
                alert('Error fetching high scores: ' + data.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error fetching high scores');
        }
    }

    fetchHighScores(); // Fetch high scores on page load

    function displayHighScores(filteredScores = null) {
        const scores = filteredScores || highScores;
        highScoresContainer.innerHTML = '';
        const startIndex = currentPage * scoresPerPage;
        const endIndex = startIndex + scoresPerPage;
        const visibleScores = scores.slice(startIndex, endIndex);
        
        visibleScores.forEach((score, index) => {
            let playerName = score.playerName;
            if (score.playerName2 != null) {
            playerName = score.playerName2;
            }
            else {
            playerName = score.playerName;
            }
            const scoreEntry = document.createElement('div');
            scoreEntry.className = 'high-score-entry';
            scoreEntry.innerHTML = `
                <span>#${highScores.indexOf(score) + 1}</span>
                <span>${playerName}</span>
                <span>${score.score} points</span>
                <span>Turn ${score.turnNumber}</span>
                <span>${formatDate(score.date)}</span>
            `;
            scoreEntry.style.animationDelay = `${index * 0.1}s`;
            highScoresContainer.appendChild(scoreEntry);
        });

        prevPageBtn.disabled = currentPage === 0;
        nextPageBtn.disabled = endIndex >= scores.length;
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    }

    function searchHighScores() {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredScores = highScores.filter(score => 
            score.playerName.toLowerCase().includes(searchTerm)
        );
        currentPage = 0;
        displayHighScores(filteredScores);
    }

    function handlePrevPage() {
        if (currentPage > 0) {
            currentPage--;
            displayHighScores();
        }
    }

    function handleNextPage() {
        if ((currentPage + 1) * scoresPerPage < highScores.length) {
            currentPage++;
            displayHighScores();
        }
    }

    function handleSearchKeypress(e) {
        if (e.key === 'Enter') {
            searchHighScores();
        }
    }

    function handleReturnToMenu() {
        removeEventListeners();
        window.location.href = '../html/index.html';
    }

    setupEventListeners();
});

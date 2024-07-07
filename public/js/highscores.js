document.addEventListener('DOMContentLoaded', () => {
    const highScoresContainer = document.getElementById('high-scores-container');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const returnToMenuBtn = document.getElementById('return-to-menu');

    let highScores = [];
    let currentPage = 0;
    const scoresPerPage = 3; // Adjusted to fit within the max height of 400px

    const sampleHighScores = [
        { playerName: 'Alice', score: 1500, turnNumber: 10, date: '2023-07-01T12:34:56Z' },
        { playerName: 'Bob', score: 1400, turnNumber: 12, date: '2023-07-02T12:34:56Z' },
        { playerName: 'Charlie', score: 1300, turnNumber: 14, date: '2023-07-03T12:34:56Z' },
        { playerName: 'Dave', score: 1200, turnNumber: 16, date: '2023-07-04T12:34:56Z' },
        { playerName: 'Eve', score: 1100, turnNumber: 18, date: '2023-07-05T12:34:56Z' },
        { playerName: 'Frank', score: 1000, turnNumber: 20, date: '2023-07-06T12:34:56Z' },
        { playerName: 'Grace', score: 900, turnNumber: 22, date: '2023-07-07T12:34:56Z' },
        { playerName: 'Heidi', score: 800, turnNumber: 24, date: '2023-07-08T12:34:56Z' },
        { playerName: 'Ivan', score: 700, turnNumber: 26, date: '2023-07-09T12:34:56Z' },
        { playerName: 'Judy', score: 600, turnNumber: 28, date: '2023-07-10T12:34:56Z' }
    ];

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
    highScores = sampleHighScores
    
    displayHighScores();

    function displayHighScores(filteredScores = null) {
        const scores = filteredScores || highScores;
        highScoresContainer.innerHTML = '';
        const startIndex = currentPage * scoresPerPage;
        const endIndex = startIndex + scoresPerPage;
        const visibleScores = scores.slice(startIndex, endIndex);

        visibleScores.forEach((score, index) => {
            const scoreEntry = document.createElement('div');
            scoreEntry.className = 'high-score-entry';
            scoreEntry.innerHTML = `
                <span>#${highScores.indexOf(score) + 1}</span>
                <span>${score.playerName}</span>
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

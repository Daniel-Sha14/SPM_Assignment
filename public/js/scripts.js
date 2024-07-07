function saveGame() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('You need to be logged in to save the game.');
        return;
    }

    const gameState = {
        gridSize: gridSize,
        buildingsGrid: buildingsGrid,
        points: points,
        coins: coins,
        turnNumber: turnNumber,
        gameMode: 'arcade'
    };

    fetch('/save-game', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(gameState)
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            alert('Game saved successfully!');
        } else {
            alert('Error saving game: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error saving game');
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('grid');

    // Create the grid squares
    for (let i = 0; i < gridSize * gridSize; i++) {  // 20x20 grid
        const square = document.createElement('div');
        square.classList.add('grid-square');
        square.addEventListener('click', () => {
            if (demolishMode) {
                demolishBuilding(square);
            } else {
                placeBuilding(square);
            }
        });
        grid.appendChild(square);
    }

    const loadedGame = localStorage.getItem('loadedGame');
    if (loadedGame) {
        loadGameState(JSON.parse(loadedGame));
        localStorage.removeItem('loadedGame'); // Clear the loaded game from localStorage
    } else {
        initializeGame(); // Initialize the game here to ensure the initial buildings are selected
    }
});

function loadGameState(gameState) {
    gridSize = gameState.gridSize;
    buildingsGrid = gameState.buildingsGrid;
    points = gameState.points;
    coins = gameState.coins;
    turnNumber = gameState.turnNumber;
    gameMode = gameState.gameMode;

    const grid = document.getElementById('grid');
    grid.innerHTML = ''; // Clear the grid

    for (let i = 0; i < gridSize * gridSize; i++) {
        const square = document.createElement('div');
        square.classList.add('grid-square');
        const row = Math.floor(i / gridSize);
        const col = i % gridSize;
        if (buildingsGrid[row][col]) {
            square.innerText = buildings[buildingsGrid[row][col]].icon;
            square.classList.add('built');
        }
        square.addEventListener('click', () => {
            if (demolishMode) {
                demolishBuilding(square);
            } else {
                placeBuilding(square);
            }
        });
        grid.appendChild(square);
    }

    initializeGame(); // Initialize the game here to ensure the initial buildings are selected
}


const buildings = {
    residential: {
        description: 'Residential (R): If it is next to an industry (I), then it scores 1 point only. Otherwise, it scores 1 point for each adjacent residential (R) or commercial (C), and 2 points for each adjacent park (O).',
        icon: 'R',
        upkeep: 1,
        profit: 1
    },
    industry: {
        description: 'Industry (I): Scores 1 point per industry in the city. Each industry generates 1 coin per residential building adjacent to it.',
        icon: 'I',
        upkeep: 1,
        profit: 2
    },
    commercial: {
        description: 'Commercial (C): Scores 1 point per commercial adjacent to it. Each commercial generates 1 coin per residential adjacent to it.',
        icon: 'C',
        upkeep: 2,
        profit: 3
    },
    park: {
        description: 'Park (O): Scores 1 point per park adjacent to it.',
        icon: 'O',
        upkeep: 1,
        profit: 0
    },
    road: {
        description: 'Road (*): Scores 1 point per connected road (*) in the same row.',
        icon: '*',
        upkeep: 1,
        profit: 0
    }
};

let selectedBuilding = null;

let points = 0;
let coins = 16;
let turnNumber = 1;
let firstBuildingPlaced = false;
let demolishMode = false;
let gridSize = 20; // Define grid size
let buildingsGrid = Array.from({ length: gridSize }, () => Array(gridSize).fill(null)); // Define buildingsGrid
let allBuildings = Object.keys(buildings);
let availableBuildings = [...allBuildings];
let selectedBuildings = [];

function updateScoreboard() {
    document.getElementById('score').innerText = points;
    document.getElementById('coins').innerText = coins;
}

function updateTurnCounter() {
    document.getElementById('turn').innerText = `Turn: ${turnNumber}`;
}

function selectBuilding(buildingType) {
    if (!selectedBuildings.includes(buildingType)) return;

    // Remove the 'selected' class from all buildings
    document.querySelectorAll('.building').forEach(building => {
        building.classList.remove('selected');
    });

    // Add the 'selected' class to the clicked building
    document.getElementById(buildingType).classList.add('selected');
    selectedBuilding = buildingType;

    // Update the description
    document.getElementById('description-text').innerText = buildings[buildingType].description;

    // Exit demolish mode when a building is selected
    demolishMode = false;
    removeDemolishHighlights();
}

function getRandomBuilding(exclude) {
    const buildingKeys = availableBuildings.filter(key => key !== exclude && !selectedBuildings.includes(key));
    const randomIndex = Math.floor(Math.random() * buildingKeys.length);
    return buildingKeys[randomIndex];
}

function initializeGame() {
    updateTurnCounter();
    selectedBuildings = getNewBuildings();
    updateSelectedBuildingsUI();
    updateScoreboard();
}

function getNewBuildings() {
    const newBuildings = [];

    // Select two new buildings from availableBuildings
    while (newBuildings.length < 2 && availableBuildings.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableBuildings.length);
        const randomBuilding = availableBuildings.splice(randomIndex, 1)[0];
        newBuildings.push(randomBuilding);
    }

    // If we couldn't get 2 new buildings, refill availableBuildings and try again
    if (newBuildings.length < 2) {
        availableBuildings = [...allBuildings];
        while (newBuildings.length < 2) {
            const randomIndex = Math.floor(Math.random() * availableBuildings.length);
            const randomBuilding = availableBuildings.splice(randomIndex, 1)[0];
            newBuildings.push(randomBuilding);
        }
    }

    // Add the previously selected buildings back to availableBuildings
    availableBuildings.push(...selectedBuildings);

    return newBuildings;
}

function updateSelectedBuildingsUI() {
    document.querySelectorAll('.building').forEach(building => {
        if (!selectedBuildings.includes(building.id)) {
            building.classList.add('disabled');
        } else {
            building.classList.remove('disabled');
        }
        building.classList.remove('selected');
    });

    // Automatically select the first available building
    if (selectedBuildings.length > 0) {
        selectBuilding(selectedBuildings[0]);
    }
}

function highlightValidCells() {
    const gridSquares = document.querySelectorAll('.grid-square');

    gridSquares.forEach(square => {
        square.classList.remove('highlight');
        const index = Array.from(gridSquares).indexOf(square);
        const row = Math.floor(index / gridSize);
        const col = index % gridSize;

        if (!square.classList.contains('built')) { // Only highlight if the square is not occupied
            if (firstBuildingPlaced) {
                const neighbors = checkSurroundings(row, col);
                if (neighbors.some(neighbor => neighbor.type)) {
                    square.classList.add('highlight');
                }
            } else {
                square.classList.add('highlight');
            }
        }
    });
}

function buildStructure() {
    if (selectedBuilding) {
        demolishMode = false; // Exit demolish mode
        removeDemolishHighlights(); // Clear any demolish highlights when entering build mode
        highlightValidCells();
    } else {
        alert('Please select a building type first.');
    }
}

function placeBuilding(square) {
    if (square.classList.contains('highlight') && coins > 0) {
        if (square.classList.contains('built')) {
            alert('This square already has a building. You cannot build over an existing building.');
            return;
        }

        const index = Array.from(document.querySelectorAll('.grid-square')).indexOf(square);
        const row = Math.floor(index / gridSize);
        const col = index % gridSize;

        square.innerText = buildings[selectedBuilding].icon;
        square.classList.add('built');
        square.classList.remove('highlight');

        buildingsGrid[row][col] = selectedBuilding;

        coins -= 1;
        updateScoreboard();

        if (!firstBuildingPlaced) {
            firstBuildingPlaced = true;
        }

        // Remove highlight from all cells
        document.querySelectorAll('.grid-square').forEach(square => {
            square.classList.remove('highlight');
        });

        // End turn and update coins, points, and turn counter
        endTurn();
    }
}

// Enter demolish mode
function enterDemolishMode() {
    demolishMode = true;
    selectedBuilding = null; // Clear selected building when entering demolish mode
    removeBuildHighlights(); // Clear any build highlights when entering demolish mode
    document.querySelectorAll('.building').forEach(building => {
        building.classList.remove('selected');
    });
    highlightDemolishableBuildings();
}

// Highlight demolishable buildings
function highlightDemolishableBuildings() {
    const gridSquares = document.querySelectorAll('.grid-square');
    gridSquares.forEach(square => {
        if (square.classList.contains('built')) {
            square.classList.add('highlight-demolish');
        }
    });
}

// Demolish a building
function demolishBuilding(square) {
    if (coins > 0 && demolishMode && square.classList.contains('built')) {
        const index = Array.from(document.querySelectorAll('.grid-square')).indexOf(square);
        const row = Math.floor(index / gridSize);
        const col = index % gridSize;

        // Remove building
        square.innerText = '';
        square.classList.remove('built', 'highlight-demolish');
        buildingsGrid[row][col] = null;

        // Deduct coin
        coins -= 1;
        updateScoreboard();

        // Exit demolish mode
        demolishMode = false;
        removeDemolishHighlights();

        // End turn and update coins, points, and turn counter
        endTurn();
    } else if (coins <= 0) {
        alert('Not enough coins to demolish a building.');
    }
}

// Remove highlight from all cells
function removeDemolishHighlights() {
    document.querySelectorAll('.grid-square').forEach(square => {
        square.classList.remove('highlight-demolish');
    });
}

function removeBuildHighlights() {
    document.querySelectorAll('.grid-square').forEach(square => {
        square.classList.remove('highlight');
    });
}

function updateProfitAndUpkeep() {
    let totalUpkeep = 0;
    let totalProfit = 0;
    const gridSquares = document.querySelectorAll('.grid-square');
    const residentialClusters = new Set();

    // Loop through each cell in the grid
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            const index = row * gridSize + col;
            const square = gridSquares[index];
            if (square.classList.contains('built')) {
                const buildingType = buildingsGrid[row][col];
                if (buildingType) {
                    const { upkeep, profit } = buildings[buildingType];

                    totalUpkeep += upkeep;
                    totalProfit += profit;

                    // Additional profit from residential buildings connected by roads
                    if (buildingType === 'industry' || buildingType === 'commercial') {
                        const collectedResidentials = [];
                        followRoadAndCollectResidentials(row, col, collectedResidentials);
                        totalProfit += collectedResidentials.length;
                    }

                    // Collect clusters of residential buildings
                    if (buildingType === 'residential') {
                        const cluster = new Set();
                        collectResidentialCluster(row, col, cluster);
                        cluster.forEach(loc => residentialClusters.add(`${loc.row},${loc.col}`));
                    }

                    // Handle road-specific logic
                    if (buildingType === 'road') {
                        const roadCount = countConnectedRoads(row, col);
                        if (roadCount > 1) {
                            totalUpkeep -= upkeep; // Remove upkeep if road is connected
                        }
                    }
                }
            }
        }
    }

    // Remove additional upkeep for clustered residential buildings
    residentialClusters.forEach(loc => {
        const [row, col] = loc.split(',').map(Number);
        totalUpkeep -= buildings['residential'].upkeep;
    });

    // Update coins with the net profit after upkeep
    coins += (totalProfit - totalUpkeep);
    updateScoreboard();
}

/**
 * Collects all adjacent residential buildings starting from a given cell (row, col) and adds them to the cluster.
 *
 * @param {number} startRow - The starting row index.
 * @param {number} startCol - The starting column index.
 * @param {Set} cluster - A set to store the collected residential buildings.
 */
function collectResidentialCluster(startRow, startCol, cluster) {
    const queue = [{ row: startRow, col: startCol }];
    const visited = new Set([`${startRow},${startCol}`]);

    while (queue.length > 0) {
        const { row, col } = queue.shift();
        cluster.add({ row, col });

        const surroundings = checkSurroundings(row, col);
        for (let i = 0; i < surroundings.length; i++) {
            const s = surroundings[i];
            if (s.type === 'residential' && !visited.has(`${s.row},${s.col}`)) {
                queue.push(s);
                visited.add(`${s.row},${s.col}`);
            }
        }
    }
}

/**
 * Follows roads starting from a given cell (row, col) and collects all connected residential buildings.
 *
 * @param {number} startRow - The starting row index.
 * @param {number} startCol - The starting column index.
 * @param {Array} collectedResidentials - An array to store the collected residential buildings.
 */
function followRoadAndCollectResidentials(startRow, startCol, collectedResidentials) {
    const queue = [{ row: startRow, col: startCol }];
    const visited = new Set([`${startRow},${startCol}`]);

    while (queue.length > 0) {
        const { row, col } = queue.shift();

        const surroundings = checkSurroundings(row, col);
        for (let i = 0; i < surroundings.length; i++) {
            const s = surroundings[i];
            if (s.type === 'residential' && !visited.has(`${s.row},${s.col}`)) {
                collectedResidentials.push(s);
                visited.add(`${s.row},${s.col}`);
            } else if (s.type === 'road' && !visited.has(`${s.row},${s.col}`)) {
                queue.push(s);
                visited.add(`${s.row},${s.col}`);
            }
        }
    }
}

function endTurn() {
    updatePoints();
    turnNumber += 1;
    updateTurnCounter();

    updateProfitAndUpkeep();

    // Get new buildings and update UI
    selectedBuildings = getNewBuildings();
    updateSelectedBuildingsUI();
}

function updatePoints() {
    points = 0;
    const gridSquares = document.querySelectorAll('.grid-square');

    gridSquares.forEach(square => {
        if (square.classList.contains('built')) {
            const index = Array.from(gridSquares).indexOf(square);
            const row = Math.floor(index / gridSize);
            const col = index % gridSize;
            points += calculatePoints(row, col);
        }
    });

    updateScoreboard();
}

/**
 * Checks the four surrounding cells of a given cell (row, col)
 * and returns their positions and types.
 *
 * @param {number} row - The row index of the cell.
 * @param {number} col - The column index of the cell.
 * @returns {Array} An array of objects representing the surrounding cells.
 */
function checkSurroundings(row, col) {
    const directions = [
        { r: -1, c: 0 }, // up
        { r: 1, c: 0 }, // down
        { r: 0, c: -1 }, // left
        { r: 0, c: 1 } // right
    ];

    const surroundings = [];

    for (let i = 0; i < directions.length; i++) {
        const newRow = row + directions[i].r;
        const newCol = col + directions[i].c;
        if (newRow >= 0 && newRow < gridSize && newCol >= 0 && newCol < gridSize) {
            surroundings.push({ row: newRow, col: newCol, type: buildingsGrid[newRow][newCol] });
        }
    }

    return surroundings;
}

/**
 * Calculates the points for a building at a given cell (row, col) based on its type and surroundings.
 *
 * @param {number} row - The row index of the cell.
 * @param {number} col - The column index of the cell.
 * @returns {number} The calculated points for the building at the given cell.
 */
function calculatePoints(row, col) {
    const buildingType = buildingsGrid[row][col];
    if (!buildingType) return 0;

    const surroundings = checkSurroundings(row, col);
    let points = 0;

    if (buildingType === 'residential') {
        // Check if there is an adjacent industry
        for (let i = 0; i < surroundings.length; i++) {
            const s = surroundings[i];
            if (s.type === 'industry') {
                return 1;
            }
        }
        // Check if there is a road nearby
        let hasRoad = false;
        for (let i = 0; i < surroundings.length; i++) {
            if (surroundings[i].type === 'road') {
                hasRoad = true;
                break;
            }
        }
        if (!hasRoad) return 0;

        // Follow roads and collect connected buildings
        const collectedBuildings = [];
        for (let i = 0; i < surroundings.length; i++) {
            if (surroundings[i].type === 'road') {
                followRoadAndCollectBuildings(surroundings[i].row, surroundings[i].col, collectedBuildings, row, col);
            }
        }
        points = calculateBuildingPoints(buildingType, collectedBuildings, row, col);
        return points;
    } else if (buildingType === 'industry') {
        // Count all industries in the grid
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                if (buildingsGrid[i][j] === 'industry') {
                    points++;
                }
            }
        }
        return points;
    } else if (buildingType === 'road') {
        // Check if there is a road nearby
        let hasRoad = false;
        for (let i = 0; i < surroundings.length; i++) {
            if (surroundings[i].type === 'road') {
                hasRoad = true;
                break;
            }
        }
        if (!hasRoad) return 0;

        // Count all connected roads
        const roadCount = countConnectedRoads(row, col);
        return roadCount;
    } else if (buildingType === 'commercial' || buildingType === 'park') {
        // Check if there is a road nearby
        let hasRoad = false;
        for (let i = 0; i < surroundings.length; i++) {
            if (surroundings[i].type === 'road') {
                hasRoad = true;
                break;
            }
        }
        if (!hasRoad) return 0;

        // Follow roads and collect connected buildings
        const collectedBuildings = [];
        for (let i = 0; i < surroundings.length; i++) {
            if (surroundings[i].type === 'road') {
                followRoadAndCollectBuildings(surroundings[i].row, surroundings[i].col, collectedBuildings, row, col);
            }
        }
        points = calculateBuildingPoints(buildingType, collectedBuildings, row, col);
        return points;
    }

    return points;
}

/**
 * Follows roads starting from a given cell (row, col) and collects all connected buildings.
 *
 * @param {number} startRow - The starting row index.
 * @param {number} startCol - The starting column index.
 * @param {Array} collectedBuildings - An array to store the collected buildings.
 */
function countConnectedRoads(startRow, startCol) {
    const queue = [{ row: startRow, col: startCol }];
    const visited = new Set([`${startRow},${startCol}`]);
    let roadCount = 0;

    while (queue.length > 0) {
        const { row, col } = queue.shift();
        roadCount++;

        const surroundings = checkSurroundings(row, col);
        for (let i = 0; i < surroundings.length; i++) {
            const s = surroundings[i];
            if (s.type === 'road' && !visited.has(`${s.row},${s.col}`)) {
                queue.push(s);
                visited.add(`${s.row},${s.col}`);
            }
        }
    }

    return roadCount;
}

/**
 * Follows roads starting from a given cell (row, col) and collects all connected buildings.
 *
 * @param {number} startRow - The starting row index.
 * @param {number} startCol - The starting column index.
 * @param {Array} collectedBuildings - An array to store the collected buildings.
 */
function followRoadAndCollectBuildings(startRow, startCol, collectedBuildings, originalRow, originalCol) {
    const queue = [{ row: startRow, col: startCol }];
    const visited = new Set([`${startRow},${startCol}`]);

    while (queue.length > 0) {
        const { row, col } = queue.shift();

        const surroundings = checkSurroundings(row, col);
        for (let i = 0; i < surroundings.length; i++) {
            const s = surroundings[i];
            if (!visited.has(`${s.row},${s.col}`)) {
                if (s.type !== 'road' && s.type !== null && !(s.row === originalRow && s.col === originalCol)) {
                    collectedBuildings.push({ row: s.row, col: s.col, type: s.type });
                } else if (s.type === 'road') {
                    queue.push(s);
                }
                visited.add(`${s.row},${s.col}`);
            }
        }
    }
}

/**
 * Calculates points for a building based on its type and the types of collected surrounding buildings.
 *
 * @param {string} buildingType - The type of the building.
 * @param {Array} surroundingBuildings - An array of types of the collected surrounding buildings.
 * @returns {number} The calculated points for the building.
 */
function calculateBuildingPoints(buildingType, surroundingBuildings, originalRow, originalCol) {
    let points = 0;

    if (buildingType === 'residential') {
        for (let i = 0; i < surroundingBuildings.length; i++) {
            const building = surroundingBuildings[i];
            if (building.type === 'residential' || building.type === 'commercial') {
                points += 1;
            } else if (building.type === 'park') {
                points += 2;
            }
        }
    } else if (buildingType === 'commercial') {
        for (let i = 0; i < surroundingBuildings.length; i++) {
            const building = surroundingBuildings[i];
            if (building.type === 'commercial') {
                points++;
            }
        }
    } else if (buildingType === 'park') {
        for (let i = 0; i < surroundingBuildings.length; i++) {
            const building = surroundingBuildings[i];
            if (building.type === 'park') {
                points++;
            }
        }
    }

    return points;
}

function exitGame() {
    window.location.href = '../html/index.html';
}

window.onload = initializeGame;

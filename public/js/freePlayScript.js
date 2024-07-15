document.addEventListener('DOMContentLoaded', () => {
    const loadedGame = localStorage.getItem('loadedGame');
    if (loadedGame) {
        const gameState = JSON.parse(loadedGame);
        gridSize = gameState.gridSize;
        buildingsGrid = gameState.buildingsGrid;
        points = gameState.points;
        coins = gameState.coins;
        turnNumber = gameState.turnNumber;
        gameMode = gameState.gameMode;
        localStorage.removeItem('loadedGame'); 

        initializeGrid(gridSize); 
        initializeGame(); 
    } else{ ;
        initializeGrid(gridSize); 
        initializeGame(); 
    }
});

let gridSize = 5;
let buildingsGrid = Array.from({ length: gridSize }, () => Array(gridSize).fill(null));
let buildMode = false; 
const maxGridSize = 95;
let consecutiveDeficitTurns = 0;
const maxDeficitTurns = 20; 

function initializeGrid(size) {
    const grid = document.getElementById('grid');
    grid.innerHTML = '';
    grid.style.gridTemplateColumns = `repeat(${size}, 50px)`; 
    grid.style.gridTemplateRows = `repeat(${size}, 50px)`; 

    const fragment = document.createDocumentFragment();

    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            const square = document.createElement('div');
            square.classList.add('grid-square');
            square.dataset.row = i;
            square.dataset.col = j;
            if (buildingsGrid[i][j]) {
                square.innerText = buildings[buildingsGrid[i][j]].icon;
                square.classList.add('built');
            }
            fragment.appendChild(square);
        }
    }

    grid.appendChild(fragment);

  
    const platform = document.querySelector('.platform');
    const platformSize = size * 52; 
    platform.style.width = `${platformSize}px`;
    platform.style.height = `${platformSize}px`;

    
    grid.removeEventListener('click', handleGridClick); 
    grid.addEventListener('click', handleGridClick);
}

function handleGridClick(event) {
    const square = event.target.closest('.grid-square');
    if (!square) return;

    const row = parseInt(square.dataset.row);
    const col = parseInt(square.dataset.col);

    if (demolishMode) {
        demolishBuilding(row, col, square);
    } else if (buildMode) {
        placeBuilding(row, col, square);
    }
}

function expandGrid() {
    if (gridSize >= maxGridSize) {
        alert('Maximum grid size reached!');
        return;
    }

    const newGridSize = Math.min(gridSize + 10, maxGridSize); 
    const offset = Math.floor((newGridSize - gridSize) / 2);

    const newBuildingsGrid = Array.from({ length: newGridSize }, () => Array(newGridSize).fill(null));

    
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            newBuildingsGrid[i + offset][j + offset] = buildingsGrid[i][j];
        }
    }

    gridSize = newGridSize;
    buildingsGrid = newBuildingsGrid;
    initializeGrid(gridSize);
}

function placeBuilding(row, col, square) {
    if (!square.classList.contains('built') && selectedBuilding) {
        square.innerText = buildings[selectedBuilding].icon;
        square.classList.add('built');
        buildingsGrid[row][col] = selectedBuilding;

        if (!firstBuildingPlaced) {
            firstBuildingPlaced = true;
        }

       
        if (row === 0 || col === 0 || row === gridSize - 1 || col === gridSize - 1) {
            expandGrid();
        }

      
        document.querySelectorAll('.grid-square').forEach(square => {
            square.classList.remove('highlight');
        });

      
        const remainingBuilding = selectedBuildings.find(b => b !== selectedBuilding);
        const newBuilding = getRandomBuilding(remainingBuilding);
        selectedBuildings = [selectedBuilding, newBuilding];

        updateSelectedBuildingsUI();

       
        endTurn();
    }
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
let selectedBuildings = [];
let points = 0;
let coins = Infinity; 
let turnNumber = 1;
let firstBuildingPlaced = false;
let demolishMode = false;

function updateScoreboard() {
    document.getElementById('score').innerText = points;
    document.getElementById('coins').innerText = coins;
}

function updateTurnCounter() {
    document.getElementById('turn').innerText = `Turn: ${turnNumber}`;
}

function selectBuilding(buildingType) {

    document.querySelectorAll('.building').forEach(building => {
        building.classList.remove('selected');
    });

    document.getElementById(buildingType).classList.add('selected');
    selectedBuilding = buildingType;

    document.getElementById('description-text').innerText = buildings[buildingType].description;

    demolishMode = false;
    removeDemolishHighlights();
}

function getRandomBuilding(exclude) {
    const buildingKeys = Object.keys(buildings).filter(key => key !== exclude);
    const randomIndex = Math.floor(Math.random() * buildingKeys.length);
    return buildingKeys[randomIndex];
}

function initializeGame() {
    updateTurnCounter();
    selectedBuildings = [getRandomBuilding(null), getRandomBuilding(null)];
    updateSelectedBuildingsUI();
    updateScoreboard();
}

function updateSelectedBuildingsUI() {
    document.querySelectorAll('.building').forEach(building => {
        building.classList.remove('disabled');
        building.classList.remove('selected');
    });

    selectBuilding(selectedBuildings[0]);
}

function highlightValidCells() {
    const gridSquares = document.querySelectorAll('.grid-square');

    gridSquares.forEach(square => {
        square.classList.remove('highlight');
        const row = parseInt(square.dataset.row);
        const col = parseInt(square.dataset.col);

        if (isValidPlacement(row, col)) {
            square.classList.add('highlight');
        }
    });
}

function isValidPlacement(row, col) {
    return !buildingsGrid[row][col]; 
}

function buildStructure() {
    if (selectedBuilding) {
        demolishMode = false; 
        buildMode = true; 
        removeDemolishHighlights(); 
        highlightValidCells();
    } else {
        alert('Please select a building type first.');
    }
}

function enterDemolishMode() {
    demolishMode = true;
    buildMode = false; 
    selectedBuilding = null;
    removeBuildHighlights(); 
    document.querySelectorAll('.building').forEach(building => {
        building.classList.remove('selected');
    });
    highlightDemolishableBuildings();
}

function highlightDemolishableBuildings() {
    const gridSquares = document.querySelectorAll('.grid-square');
    gridSquares.forEach(square => {
        const row = parseInt(square.dataset.row);
        const col = parseInt(square.dataset.col);

        if (square.classList.contains('built')) {
            square.classList.add('highlight-demolish');
        }
    });
}

function demolishBuilding(row, col, square) {
    if (demolishMode && square.classList.contains('built')) {
        square.innerText = '';
        square.classList.remove('built', 'highlight-demolish');
        buildingsGrid[row][col] = null;
        demolishMode = false;
        removeDemolishHighlights();
        endTurn();
    }
}

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

function endTurn() {
    buildMode = false; 
    turnNumber += 1;
    updateTurnCounter();
    removeBuildHighlights(); 
    updatePoints(); 
    updateProfitAndUpkeep(); 
}

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


function calculatePoints(row, col) {
    const buildingType = buildingsGrid[row][col];
    if (!buildingType) return 0;

    const surroundings = checkSurroundings(row, col);
    let points = 0;

    if (buildingType === 'residential') {
      
        for (let i = 0; i < surroundings.length; i++) {
            const s = surroundings[i];
            if (s.type === 'industry') {
                return 1;
            }
        }
       
        let hasRoad = false;
        for (let i = 0; i < surroundings.length; i++) {
            if (surroundings[i].type === 'road') {
                hasRoad = true;
                break;
            }
        }
        if (!hasRoad) return 0;
        
        const collectedBuildings = [];
        for (let i = 0; i < surroundings.length; i++) {
            if (surroundings[i].type === 'road') {
                followRoadAndCollectBuildings(surroundings[i].row, surroundings[i].col, collectedBuildings, row, col);
            }
        }
        points = calculateBuildingPoints(buildingType, collectedBuildings, row, col);
        return points;
    } else if (buildingType === 'industry') {
       
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                if (buildingsGrid[i][j] === 'industry') {
                    points++;
                }
            }
        }
        return points;
    } else if (buildingType === 'road') {
        
        let hasRoad = false;
        for (let i = 0; i < surroundings.length; i++) {
            if (surroundings[i].type === 'road') {
                hasRoad = true;
                break;
            }
        }
        if (!hasRoad) return 0;

        
        const roadCount = countConnectedRoads(row, col);
        return roadCount;
    } else if (buildingType === 'commercial' || buildingType === 'park') {
        
        let hasRoad = false;
        for (let i = 0; i < surroundings.length; i++) {
            if (surroundings[i].type === 'road') {
                hasRoad = true;
                break;
            }
        }
        if (!hasRoad) return 0;

       
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


function updatePoints() {
    points = 0;
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            if (buildingsGrid[row][col]) {
                points += calculatePoints(row, col);
            }
        }
    }
    updateScoreboard();
}

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
        coins: -1,
        turnNumber: turnNumber,
        gameMode: 'freePlay'
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

function exitGame() {
    window.location.href = '../html/index.html';
}

function updateProfitAndUpkeep() {
    let totalUpkeep = 0;
    let totalProfit = 0;
    const gridSquares = document.querySelectorAll('.grid-square');
    const visitedResidential = new Set();

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

                    
                    if (buildingType === 'industry' || buildingType === 'commercial') {
                        const collectedResidentials = new Set();
                        const surroundings = checkSurroundings(row, col);
                        surroundings.forEach(surrounding => {
                            if (surrounding.type === 'road') {
                                followRoadAndCollectResidentials(surrounding.row, surrounding.col, collectedResidentials);
                            }
                        });
                        totalProfit += collectedResidentials.size;
                    }

                   
                    if (buildingType === 'residential' && !visitedResidential.has(`${row},${col}`)) {
                        const cluster = new Set();
                        collectResidentialCluster(row, col, cluster);
                        cluster.forEach(loc => visitedResidential.add(`${loc.row},${loc.col}`));
                        totalUpkeep -= upkeep * cluster.size;
                        totalUpkeep += 1;
                    }

                    // Handle road-specific logic
                    if (buildingType === 'road') {
                        const roadCount = countConnectedRoads(row, col);
                        if (roadCount > 1) {
                            totalUpkeep -= upkeep; 
                        }
                    }
                }
            }
        }
    }

    const netProfit = totalProfit - totalUpkeep;
    console.log(netProfit);
    updateScoreboard();

    if (netProfit < 0) {
        consecutiveDeficitTurns++;
    } else {
        consecutiveDeficitTurns = 0;
    }

    if (consecutiveDeficitTurns >= maxDeficitTurns) {
        setTimeout(() => {
        alert('Game Over! You have had a deficit for 20 consecutive turns.');
        endGame();
        }, 500);
    }
}


function endGame() {
    alert('Game Over! Returning to the main menu.');
    window.location.href = '../html/index.html';
}

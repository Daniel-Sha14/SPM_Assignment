document.addEventListener('DOMContentLoaded', () => {
    initializeGrid(5); // Start with a 5x5 grid
    initializeGame(); // Initialize the game here to ensure the initial buildings are selected
});

let gridSize = 5;
let buildingsGrid = Array.from({ length: gridSize }, () => Array(gridSize).fill(null));
let buildMode = false; // Track if build mode is active

function initializeGrid(size) {
    const grid = document.getElementById('grid');
    grid.innerHTML = ''; // Clear the grid
    grid.style.gridTemplateColumns = `repeat(${size}, 50px)`; // Set each cell to be 50px by 50px
    grid.style.gridTemplateRows = `repeat(${size}, 50px)`; 

    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            const square = document.createElement('div');
            square.classList.add('grid-square');
            if (buildingsGrid[i][j]) {
                square.innerText = buildings[buildingsGrid[i][j]].icon;
                square.classList.add('built');
            }
            square.addEventListener('click', () => {
                if (demolishMode) {
                    demolishBuilding(i, j, square);
                } else if (buildMode) {
                    placeBuilding(i, j, square);
                }
            });
            grid.appendChild(square);
        }
    }

    // Adjust platform size based on grid size
    const platform = document.querySelector('.platform');
    const platformSize = size * 52; // 50px cell size + 2px gap
    platform.style.width = `${platformSize}px`;
    platform.style.height = `${platformSize}px`;
}

function expandGrid() {
    gridSize += 10; // Expand by 10 (5 rows/columns on each side)

    const newBuildingsGrid = Array.from({ length: gridSize }, () => Array(gridSize).fill(null));

    // Copy old grid to the new center
    const offset = 5;
    for (let i = 0; i < gridSize - 10; i++) {
        for (let j = 0; j < gridSize - 10; j++) {
            newBuildingsGrid[i + offset][j + offset] = buildingsGrid[i][j];
        }
    }

    buildingsGrid = newBuildingsGrid;
    initializeGrid(gridSize);
}

function placeBuilding(row, col, square) {
    if (!square.classList.contains('built')) {
        square.innerText = buildings[selectedBuilding].icon;
        square.classList.add('built');
        buildingsGrid[row][col] = selectedBuilding;

        if (!firstBuildingPlaced) {
            firstBuildingPlaced = true;
        }

        // Check if placed on border to trigger expansion
        if (row === 0 || col === 0 || row === gridSize - 1 || col === gridSize - 1) {
            expandGrid();
        }

        // Remove highlight from all cells
        document.querySelectorAll('.grid-square').forEach(square => {
            square.classList.remove('highlight');
        });

        // Update selected buildings for next turn
        const remainingBuilding = selectedBuildings.find(b => b !== selectedBuilding);
        const newBuilding = getRandomBuilding(remainingBuilding);
        selectedBuildings = [selectedBuilding, newBuilding];

        // Update the UI for new buildings
        updateSelectedBuildingsUI();

        // End turn and update coins, points, and turn counter
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
let coins = Infinity; // Unlimited coins for Free Play mode
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
    // Enable selecting any building type
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
        const row = Math.floor(Array.from(square.parentNode.children).indexOf(square) / gridSize);
        const col = Array.from(square.parentNode.children).indexOf(square) % gridSize;

        if (isValidPlacement(row, col)) {
            square.classList.add('highlight');
        }
    });
}

function isValidPlacement(row, col) {
    return !buildingsGrid[row][col]; // Valid placement if the cell is not occupied
}

function buildStructure() {
    if (selectedBuilding) {
        demolishMode = false; // Exit demolish mode
        buildMode = true; // Enter build mode
        removeDemolishHighlights(); // Clear any demolish highlights when entering build mode
        highlightValidCells();
    } else {
        alert('Please select a building type first.');
    }
}

function enterDemolishMode() {
    demolishMode = true;
    buildMode = false; // Exit build mode when entering demolish mode
    selectedBuilding = null; // Clear selected building when entering demolish mode
    removeBuildHighlights(); // Clear any build highlights when entering demolish mode
    document.querySelectorAll('.building').forEach(building => {
        building.classList.remove('selected');
    });
    highlightDemolishableBuildings();
}

function highlightDemolishableBuildings() {
    const gridSquares = document.querySelectorAll('.grid-square');
    gridSquares.forEach(square => {
        const row = Math.floor(Array.from(square.parentNode.children).indexOf(square) / gridSize);
        const col = Array.from(square.parentNode.children).indexOf(square) % gridSize;

        if (square.classList.contains('built') && isOuterLayer(row, col)) {
            square.classList.add('highlight-demolish');
        }
    });
}

function isOuterLayer(row, col) {
    const neighbors = getNeighbors(row, col);
    return neighbors.some(neighbor => !neighbor || !buildingsGrid[neighbor.row][neighbor.col]);
}

function demolishBuilding(row, col, square) {
    if (demolishMode && square.classList.contains('built') && isOuterLayer(row, col)) {
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
    buildMode = false; // Exit build mode at the end of each turn
    turnNumber += 1;
    updateTurnCounter();
    removeBuildHighlights(); // Remove highlights at the end of each turn
    updatePoints(); // Calculate points at the end of each turn
    updateProfitAndUpkeep(); // Calculate profit and upkeep at the end of each turn
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

function calculatePoints(row, col) {
    const buildingType = buildingsGrid[row][col];
    const adjacent = getAdjacentBuildings(row, col);
    let buildingPoints = 0;

    switch (buildingType) {
        case 'residential':
            if (adjacent.includes('industry')) {
                buildingPoints = 1;
            } else {
                buildingPoints = adjacent.filter(b => b === 'residential' || b === 'commercial').length +
                                 2 * adjacent.filter(b => b === 'park').length;
            }
            break;
        case 'industry':
            buildingPoints = buildingsGrid.flat().filter(b => b === 'industry').length;
            break;
        case 'commercial':
            buildingPoints = adjacent.filter(b => b === 'commercial').length;
            break;
        case 'park':
            buildingPoints = adjacent.filter(b => b === 'park').length;
            break;
        case 'road':
            buildingPoints = calculateRoadPoints(row, col);
            break;
    }

    return buildingPoints;
}
function calculateRoadPoints(row, col) {
    let connectedRoads = new Set();
    let stack = [[row, col]];

    while (stack.length > 0) {
        let [currentRow, currentCol] = stack.pop();
        let key = `${currentRow},${currentCol}`;

        if (connectedRoads.has(key)) continue;
        connectedRoads.add(key);

        // Check all four directions
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (const [dr, dc] of directions) {
            let newRow = currentRow + dr;
            let newCol = currentCol + dc;

            if (newRow >= 0 && newRow < gridSize && newCol >= 0 && newCol < gridSize) {
                if (buildingsGrid[newRow][newCol] === 'road') {
                    stack.push([newRow, newCol]);
                }
            }
        }
    }

    // If there's only one road, return 0 points
    if (connectedRoads.size === 1) {
        return 0;
    }

    // Calculate the score: length * length
    const length = connectedRoads.size;
    return length;
}
function updateProfitAndUpkeep() {
    let profit = 0;
    let upkeep = 0;
    const visitedResidential = new Set();

    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            const buildingType = buildingsGrid[row][col];
            if (buildingType) {
                switch (buildingType) {
                    case 'residential':
                        profit += 1;
                        if (!visitedResidential.has(`${row},${col}`)) {
                            upkeep += calculateResidentialClusterUpkeep(row, col, visitedResidential);
                        }
                        break;
                    case 'industry':
                        profit += 2 + calculateIndustryProfit(row, col);
                        upkeep += 1;
                        break;
                    case 'commercial':
                        profit += 3 + calculateCommercialProfit(row, col);
                        upkeep += 2;
                        break;
                    case 'park':
                        upkeep += 1;
                        break;
                    case 'road':
                        if (!isConnectedRoad(row, col)) {
                            upkeep += 1;
                        }
                        break;
                }
            }
        }
    }

    coins += profit - upkeep;
    updateScoreboard();
}

function calculateResidentialClusterUpkeep(row, col, visited) {
    const stack = [[row, col]];
    let clusterSize = 0;

    while (stack.length > 0) {
        const [r, c] = stack.pop();
        const key = `${r},${c}`;

        if (visited.has(key)) continue;
        visited.add(key);

        if (buildingsGrid[r][c] === 'residential') {
            clusterSize++;
            for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
                const newRow = r + dr;
                const newCol = c + dc;
                if (newRow >= 0 && newRow < gridSize && newCol >= 0 && newCol < gridSize) {
                    stack.push([newRow, newCol]);
                }
            }
        }
    }

    return clusterSize > 0 ? 1 : 0;
}

function calculateIndustryProfit(row, col) {
    return getAdjacentBuildings(row, col).filter(b => b === 'residential').length;
}

function calculateCommercialProfit(row, col) {
    return getAdjacentBuildings(row, col).filter(b => b === 'residential').length;
}

function isConnectedRoad(row, col) {
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dr, dc] of directions) {
        const newRow = row + dr;
        const newCol = col + dc;
        if (newRow >= 0 && newRow < gridSize && newCol >= 0 && newCol < gridSize) {
            const neighborBuilding = buildingsGrid[newRow][newCol];
            if (neighborBuilding && neighborBuilding !== 'road') {
                return true;
            }
        }
    }return false;
}

function getAdjacentBuildings(row, col) {
    const adjacent = [];
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    for (const [dr, dc] of directions) {
        let newRow = row + dr;
        let newCol = col + dc;

        // Follow the road
        while (newRow >= 0 && newRow < gridSize && newCol >= 0 && newCol < gridSize) {
            const building = buildingsGrid[newRow][newCol];

            if (building === 'road') {
                newRow += dr;
                newCol += dc;
            } else if (building) {
                adjacent.push(building);
                break;
            } else {
                break;
            }
        }
    }

    return adjacent;
}

function saveGame() {
    alert("Game saved!");
}

function exitGame() {
    window.location.href = 'index.html';
}

function getNeighbors(row, col) {
    const neighbors = [];
    if (row > 0) neighbors.push({ row: row - 1, col });
    if (row < gridSize - 1) neighbors.push({ row: row + 1, col });
    if (col > 0) neighbors.push({ row, col: col - 1 });
    if (col < gridSize - 1) neighbors.push({ row, col: col + 1 });

    return neighbors;
}

window.onload = initializeGame;
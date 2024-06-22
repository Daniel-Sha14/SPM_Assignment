document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('grid');

    // Create the grid squares
    for (let i = 0; i < 400; i++) {  // 20x20 grid
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

    initializeGame(); // Initialize the game here to ensure the initial buildings are selected
});

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
let coins = 16;
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
    const buildingKeys = Object.keys(buildings).filter(key => key !== exclude && !selectedBuildings.includes(key));
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
        if (!selectedBuildings.includes(building.id)) {
            building.classList.add('disabled');
        } else {
            building.classList.remove('disabled');
        }
        building.classList.remove('selected');
    });

    // Automatically select the first available building
    selectBuilding(selectedBuildings[0]);
}

function highlightValidCells() {
    const gridSquares = document.querySelectorAll('.grid-square');

    gridSquares.forEach(square => {
        square.classList.remove('highlight');
        if (firstBuildingPlaced) {
            const neighbors = getNeighbors(square);
            if (neighbors.some(neighbor => neighbor.classList.contains('built'))) {
                square.classList.add('highlight');
            }
        } else {
            square.classList.add('highlight');
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
        square.innerText = buildings[selectedBuilding].icon;
        square.classList.add('built');
        square.classList.remove('highlight');

        coins -= 1;
        updateScoreboard();

        if (!firstBuildingPlaced) {
            firstBuildingPlaced = true;
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
        if (square.classList.contains('built') && isOuterLayer(square)) {
            square.classList.add('highlight-demolish');
        }
    });
}

// Check if the building is on the outer layer
function isOuterLayer(square) {
    const neighbors = getNeighbors(square);
    return neighbors.some(neighbor => !neighbor.classList.contains('built'));
}

// Demolish a building
function demolishBuilding(square) {
    if (coins > 0 && demolishMode && square.classList.contains('built') && isOuterLayer(square)) {
        // Remove building
        square.innerText = '';
        square.classList.remove('built', 'highlight-demolish');

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

function endTurn() {
    updateProfitAndUpkeep();
    updatePoints();
    turnNumber += 1;
    updateTurnCounter();
}

function updateProfitAndUpkeep() {
    let profit = 0;
    let upkeep = 0;
    const gridSquares = document.querySelectorAll('.grid-square');

    gridSquares.forEach(square => {
        if (square.classList.contains('built')) {
            const buildingType = Object.keys(buildings).find(key => buildings[key].icon === square.innerText);
            if (buildingType) {
                profit += buildings[buildingType].profit;
                upkeep += buildings[buildingType].upkeep;

                if (buildingType === 'industry') {
                    const neighbors = getNeighbors(square).filter(neighbor => neighbor.innerText === 'R');
                    profit += neighbors.length; // Each adjacent residential building generates 1 coin
                } else if (buildingType === 'commercial') {
                    const neighbors = getNeighbors(square).filter(neighbor => neighbor.innerText === 'R');
                    profit += neighbors.length; // Each adjacent residential building generates 1 coin
                }
            }
        }
    });

    const residentialClusters = [];
    const visited = new Set();

    gridSquares.forEach(square => {
        if (square.classList.contains('built') && square.innerText === 'R' && !visited.has(square)) {
            const cluster = [];
            const stack = [square];

            while (stack.length) {
                const current = stack.pop();
                if (!visited.has(current)) {
                    visited.add(current);
                    cluster.push(current);

                    const neighbors = getNeighbors(current).filter(neighbor => neighbor.innerText === 'R');
                    neighbors.forEach(neighbor => {
                        if (!visited.has(neighbor)) {
                            stack.push(neighbor);
                        }
                    });
                }
            }

            residentialClusters.push(cluster);
        }
    });

    residentialClusters.forEach(cluster => {
        upkeep += 1; // Each cluster requires 1 coin per turn to upkeep
    });

    coins += profit - upkeep;
    updateScoreboard();
}

function updatePoints() {
    points = 0;
    const gridSquares = document.querySelectorAll('.grid-square');

    gridSquares.forEach(square => {
        if (square.classList.contains('built')) {
            const buildingType = Object.keys(buildings).find(key => buildings[key].icon === square.innerText);
            const neighbors = getNeighbors(square);

            if (buildingType === 'residential') {
                if (neighbors.some(neighbor => neighbor.innerText === 'I')) {
                    points += 1;
                } else {
                    neighbors.forEach(neighbor => {
                        if (neighbor.innerText === 'R' || neighbor.innerText === 'C') {
                            points += 1;
                        } else if (neighbor.innerText === 'O') {
                            points += 2;
                        }
                    });
                }
            } else if (buildingType === 'industry') {
                points += document.querySelectorAll('.grid-square.built').length;
            } else if (buildingType === 'commercial') {
                neighbors.forEach(neighbor => {
                    if (neighbor.innerText === 'C') {
                        points += 1;
                    }
                });
            } else if (buildingType === 'park') {
                neighbors.forEach(neighbor => {
                    if (neighbor.innerText === 'O') {
                        points += 1;
                    }
                });
            } else if (buildingType === 'road') {
                const rowSize = Math.sqrt(gridSquares.length);
                const rowIndex = Math.floor(Array.from(gridSquares).indexOf(square) / rowSize);
                const rowSquares = Array.from(gridSquares).slice(rowIndex * rowSize, (rowIndex + 1) * rowSize);
                points += rowSquares.filter(s => s.innerText === '*').length;
            }
        }
    });

    updateScoreboard();
}

function saveGame() {
    alert("Game saved!");
}

function exitGame() {
    window.location.href = '../index.html';
}

function getNeighbors(square) {
    const grid = document.getElementById('grid');
    const squares = Array.from(grid.children);
    const index = squares.indexOf(square);
    const rowSize = Math.sqrt(squares.length);

    const neighbors = [];

    if (index % rowSize !== 0) { // left neighbor
        neighbors.push(squares[index - 1]);
    }
    if (index % rowSize !== rowSize - 1) { // right neighbor
        neighbors.push(squares[index + 1]);
    }
    if (index >= rowSize) { // top neighbor
        neighbors.push(squares[index - rowSize]);
    }
    if (index < squares.length - rowSize) { // bottom neighbor
        neighbors.push(squares[index + rowSize]);
    }

    return neighbors;
}

window.onload = initializeGame;
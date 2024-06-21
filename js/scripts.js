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
});

const buildings = {
    residential: {
        description: 'Residential (R): If it is next to an industry (I), then it scores 1 point only. Otherwise, it scores 1 point for each adjacent residential (R) or commercial (C), and 2 points for each adjacent park (O).',
        icon: 'R'
    },
    industry: {
        description: 'Industry (I): Scores 1 point per industry in the city. Each industry generates 1 coin per residential building adjacent to it.',
        icon: 'I'
    },
    commercial: {
        description: 'Commercial (C): Scores 1 point per commercial adjacent to it. Each commercial generates 1 coin per residential adjacent to it.',
        icon: 'C'
    },
    park: {
        description: 'Park (O): Scores 1 point per park adjacent to it.',
        icon: 'O'
    },
    road: {
        description: 'Road (*): Scores 1 point per connected road (*) in the same row.',
        icon: '*'
    }
};

let selectedBuilding = null;
let selectedBuildings = [];
let points = 0;
let coins = 16;
let firstBuildingPlaced = false;
let demolishMode = false;

function updateScoreboard() {
    document.getElementById('score').innerText = points;
    document.getElementById('coins').innerText = coins;
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

function getRandomBuildings() {
    const buildingKeys = Object.keys(buildings);
    while (selectedBuildings.length < 2) {
        const randomBuilding = buildingKeys[Math.floor(Math.random() * buildingKeys.length)];
        if (!selectedBuildings.includes(randomBuilding)) {
            selectedBuildings.push(randomBuilding);
        }
    }
}

function initializeGame() {
    getRandomBuildings();

    document.querySelectorAll('.building').forEach(building => {
        if (!selectedBuildings.includes(building.id)) {
            building.classList.add('disabled');
        } else {
            building.classList.remove('disabled');
        }
    });

    updateScoreboard();
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

        // Do not exit build mode after placing a building
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

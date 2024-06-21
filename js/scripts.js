document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('grid');

    // Create the grid squares
    for (let i = 0; i < 400; i++) {  // 20x20 grid
        const square = document.createElement('div');
        square.classList.add('grid-square');
        square.addEventListener('click', () => placeBuilding(square));
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

        // Reset selected building
        selectedBuilding = null;
        document.querySelectorAll('.building').forEach(building => {
            building.classList.remove('selected');
        });

        // Remove highlight from all cells
        document.querySelectorAll('.grid-square').forEach(square => {
            square.classList.remove('highlight');
        });
    }
}

// After demolish button is pressed, it enter demolish mode
function enterDemolishMode() {
    demolishMode = true;
    highlightDemolishableBuildings();
}

// Highlight demolishable buildings
function highlightDemolishableBuildings() {
    const gridSquares = document.querySelectorAll('.grid-square');
    gridSquares.forEach(square => {
        if (square.classList.contains('built')) {
            square.classList.add('highlight-demolish');
            square.addEventListener('click', () => demolishBuilding(square), { once: true });
        }
    });
}

// Demolish a Building
function demolishBuilding(square) {
    if (demolishMode && square.classList.contains('built')) {
        // Remove building
        square.innerText = '';
        square.classList.remove('built', 'highlight-demolish');
        
        // Refund coin
        coins += 1;
        updateScoreboard();

        // Exit demolish mode
        demolishMode = false;
        removeDemolishHighlights();
    }
}

// Remove highlight from all cells
function removeDemolishHighlights() {
    document.querySelectorAll('.grid-square').forEach(square => {
        square.classList.remove('highlight-demolish');
    });
}

function updateScoreboard() {
    document.getElementById('score').innerText = points;
    document.getElementById('coins').innerText = coins;
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

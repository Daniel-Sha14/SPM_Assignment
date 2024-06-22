document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('grid');

    // Create the grid squares
    for (let i = 0; i < 400; i++) {  // 20x20 grid
        const square = document.createElement('div');
        grid.appendChild(square);
    }

   
});

const buildings = {
    residential: {
        description: 'Residential (R): If it is next to an industry (I), then it scores 1 point only. Otherwise, it scores 1 point for each adjacent residential (R) or commercial (C), and 2 points for each adjacent park (O).'
    },
    industry: {
        description: 'Industry (I): Scores 1 point per industry in the city. Each industry generates 1 coin per residential building adjacent to it.'
    },
    commercial: {
        description: 'Commercial (C): Scores 1 point per commercial adjacent to it. Each commercial generates 1 coin per residential adjacent to it.'
    },
    park: {
        description: 'Park (O): Scores 1 point per park adjacent to it.'
    },
    road: {
        description: 'Road (*): Scores 1 point per connected road (*) in the same row.'
    }
};

let selectedBuildings = [];
let points = 0;
let coins = 16;

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

function saveGame() {
    alert("Game saved!");
}

function exitGame() {
    window.location.href = '../index.html';
}

window.onload = initializeGame;
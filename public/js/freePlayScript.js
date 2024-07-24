//Event listener to initialise game state
document.addEventListener('DOMContentLoaded', () => {
    const loadedGame = localStorage.getItem('loadedGame');
    if (loadedGame) {
        const gameState = JSON.parse(loadedGame);
        //Load game state from local storage
        gridSize = gameState.gridSize;
        buildingsGrid = gameState.buildingsGrid;
        points = parseInt(gameState.points);
        coins = parseInt(gameState.coins);
   
        turnNumber = parseInt(gameState.turnNumber);
        gameMode = gameState.gameMode;
        const saveDate = gameState.saveDate
        localStorage.removeItem('loadedGame'); 

        if (coins == -1  || coins == NaN || coins == Infinity)  {
            coins = Infinity;
        }
        initializeGrid(gridSize); 
        initializeGame();
    } else{ ;
        initializeGrid(gridSize); 
        initializeGame(); 
    }
});
//Initialise game variables
let gridSize = 5;
let buildingsGrid = Array.from({ length: gridSize }, () => Array(gridSize).fill(null));
let buildMode = false; 
const maxGridSize = 95;
let consecutiveDeficitTurns = 0;
const maxDeficitTurns = 20; 
//Function to initialise game grid
function initializeGrid(size) {
    const grid = document.getElementById('grid');
    grid.innerHTML = '';
    grid.style.gridTemplateColumns = `repeat(${size}, 50px)`; 
    grid.style.gridTemplateRows = `repeat(${size}, 50px)`; 

    const fragment = document.createDocumentFragment();
    //Create grid
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

    //Adjusting platform size based on grid size
    const platform = document.querySelector('.platform');
    const platformSize = size * 52; 
    platform.style.width = `${platformSize}px`;
    platform.style.height = `${platformSize}px`;

    
    grid.removeEventListener('click', handleGridClick); 
    grid.addEventListener('click', handleGridClick);
}
//Function to handle grid square click events
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

function expandGrid() {
    if (gridSize >= maxGridSize) {
        alert('Maximum grid size reached!');
        return;
    }

    const newGridSize = Math.min(gridSize + 10, maxGridSize); 
    const offset = Math.floor((newGridSize - gridSize) / 2);

    const newBuildingsGrid = Array.from({ length: newGridSize }, () => Array(newGridSize).fill(null));

    // Transfer buildings to new grid
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            newBuildingsGrid[i + offset][j + offset] = buildingsGrid[i][j];
        }
    }

    gridSize = newGridSize;
    buildingsGrid = newBuildingsGrid;
    initializeGrid(gridSize);
}
// Function to place building on grid
function placeBuilding(row, col, square) {
    if (!square.classList.contains('built') && selectedBuilding) {
        square.innerText = buildings[selectedBuilding].icon;
        square.classList.add('built');
        buildingsGrid[row][col] = selectedBuilding;

        if (!firstBuildingPlaced) {
            firstBuildingPlaced = true;
        }

       //Check if grid needs to be expanded
        if (row === 0 || col === 0 || row === gridSize - 1 || col === gridSize - 1) {
            expandGrid();
        }

      
        document.querySelectorAll('.grid-square').forEach(square => {
            square.classList.remove('highlight');
        });

        //Update selected buildings
        const remainingBuilding = selectedBuildings.find(b => b !== selectedBuilding);
        const newBuilding = getRandomBuilding(remainingBuilding);
        selectedBuildings = [selectedBuilding, newBuilding];

        updateSelectedBuildingsUI();

       
        endTurn();
    }
}
//Define building properties
const buildings = {
    residential: {
        description: 'Residential (R): If it is next to an industry (I), then it scores 1 point only. Otherwise, it scores 1 point for each adjacent residential (R) or commercial (C), and 2 points for each adjacent park (O).  \n\nEach residential building generates 1 coin per turn. Each cluster of residential buildings (must be immediately next to each other) requires 1 coin per turn to upkeep.',
        icon: 'R',
        upkeep: 1,
        profit: 1
    },
    industry: {
        description: 'Industry (I): Scores 1 point per industry in the city. Each industry generates 1 coin per residential building adjacent to it.  \n\nEach industry generates 2 coins per turn and cost 1 coin per turn to upkeep.',
        icon: 'I',
        upkeep: 1,
        profit: 2
    },
    commercial: {
        description: 'Commercial (C): Scores 1 point per commercial adjacent to it. Each commercial generates 1 coin per residential adjacent to it.  \n\n Each commercial generates 3 coins per turn and cost 2 coins per turn to upkeep. ',
        icon: 'C',
        upkeep: 2,
        profit: 3
    },
    park: {
        description: 'Park (O): Scores 1 point per park adjacent to it. \n\n Each park costs 1 coin to upkeep. ',
        icon: 'O',
        upkeep: 1,
        profit: 0
    },
    road: {
        description: 'Road (*): Scores 1 point per connected road (*) in the same row.  \n\n Each unconnected road segment costs 1 coin to upkeep. ',
        icon: '*',
        upkeep: 1,
        profit: 0
    }
};
//Initialise game variables
let selectedBuilding = null;
let selectedBuildings = [];
let points = 0;
let coins = Infinity; 
let turnNumber = 1;
let firstBuildingPlaced = false;
let demolishMode = false;
//Function to update scoreboard
function updateScoreboard() {
    document.getElementById('score').innerText = points;
    document.getElementById('coins').innerText = coins;
}
//Function to update turn counter
function updateTurnCounter() {
    document.getElementById('turn').innerText = `Turn: ${turnNumber}`;
}
//Function to select a building type
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
//Function to get random building type, excluding a specific type
function getRandomBuilding(exclude) {
    const buildingKeys = Object.keys(buildings).filter(key => key !== exclude);
    const randomIndex = Math.floor(Math.random() * buildingKeys.length);
    return buildingKeys[randomIndex];
}
//Function to initialise the game
function initializeGame() {
    updateTurnCounter();
    selectedBuildings = [getRandomBuilding(null), getRandomBuilding(null)];
    updateSelectedBuildingsUI();
    updateScoreboard();
}
//Function to update selected building UI
function updateSelectedBuildingsUI() {
    document.querySelectorAll('.building').forEach(building => {
        building.classList.remove('disabled');
        building.classList.remove('selected');
    });

    selectBuilding(selectedBuildings[0]);
}
//Function to highlight valid cells for building placement
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
//Function to check if placement is valid
function isValidPlacement(row, col) {
    return !buildingsGrid[row][col]; 
}
//Function to enter build mode
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
//Function to enter demolish mode
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
//Function to highlight demolishable buildings
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
//Function to demolish building
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
//Function to remove demolish highlights
function removeDemolishHighlights() {
    document.querySelectorAll('.grid-square').forEach(square => {
        square.classList.remove('highlight-demolish');
    });
}
//Function to remove build highlights
function removeBuildHighlights() {
    document.querySelectorAll('.grid-square').forEach(square => {
        square.classList.remove('highlight');
    });
}
//Function to end turn and update game state
function endTurn() {
    buildMode = false; 
    turnNumber += 1;
    updateTurnCounter();
    removeBuildHighlights(); 
    updatePoints(); 
    updateProfitAndUpkeep(); 
    checkGameEndCondition();
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

//Function to calculate points
function calculatePoints(row, col) {
    const buildingType = buildingsGrid[row][col];
    if (!buildingType) return 0;

    const surroundings = checkSurroundings(row, col);
    let points = 0;

    if (buildingType === 'residential') {
        //Check for adjacent industry, which gives 1 point
        for (let i = 0; i < surroundings.length; i++) {
            const s = surroundings[i];
            if (s.type === 'industry') {
                return 1;
            }
        }
        //Ensure residential building is next to road
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
        //Calculate points based on number of industries in grid
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                if (buildingsGrid[i][j] === 'industry') {
                    points++;
                }
            }
        }
        return points;
    } else if (buildingType === 'road') {
        //Ensure road is connected to other roads
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
        //Ensure commercial or park is next to road
        let hasRoad = false;
        for (let i = 0; i < surroundings.length; i++) {
            if (surroundings[i].type === 'road') {
                hasRoad = true;
                break;
            }
        }
        if (!hasRoad) return 0;

        //Collect buildings connected by roads
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
//Calculate points based on building type and its surroundings
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
//Function to save game in database
function saveGame(saveName) {
    const token = localStorage.getItem('token');
    if (!token) {
        showAuthAlert();
        return;
    }

    const gameState = {
        gridSize: gridSize,
        buildingsGrid: buildingsGrid,
        points: points,
        coins: -1,
        turnNumber: turnNumber,
        gameMode: 'freePlay',
        saveDate: new Date().toISOString(),
        saveName: saveName
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




// Keep the original showAuthAlert function for other authentication needs
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

function showSaveNameAlert() {
    const alertHtml = `
        <div id="save-name-alert" style="
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
                <h2 style="color: var(--primary-color);">Save Game</h2>
                <p>Please enter a name for your save file (max 9 characters):</p>
                <input type="text" id="save-name-input" maxlength="9" style="
                    width: 100%;
                    padding: 0.5rem;
                    margin: 1rem 0;
                    border: 1px solid var(--primary-color);
                    border-radius: 5px;
                " placeholder="Enter save name">
                <p id="char-count">0 / 9</p>
                <div style="margin-top: 1rem;">
                    <button id="save-name-cancel" class="button" style="margin-right: 1rem;">Cancel</button>
                    <button id="save-name-confirm" class="button">Save</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', alertHtml);

    const saveNameInput = document.getElementById('save-name-input');
    const charCount = document.getElementById('char-count');

    saveNameInput.addEventListener('input', function() {
        const length = this.value.length;
        charCount.textContent = `${length} / 9`;
        
        if (length > 9) {
            this.value = this.value.slice(0, 9);
        }
    });

    document.getElementById('save-name-cancel').addEventListener('click', () => {
        document.getElementById('save-name-alert').remove();
    });

    document.getElementById('save-name-confirm').addEventListener('click', () => {
        const saveName = saveNameInput.value.trim();
        if (saveName) {
            document.getElementById('save-name-alert').remove();
            saveGame(saveName);
        } else {
            alert('Please enter a save name');
        }
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
   
    updateScoreboard();

    if (netProfit < 0) {
        consecutiveDeficitTurns++;

    } else {
        consecutiveDeficitTurns = 0;

    }

    if (consecutiveDeficitTurns >= maxDeficitTurns) {
        setTimeout(() => {
            //alert('Game Over! You have had a deficit for 20 consecutive turns.');
            //showGameOverModal();
            console.log("showGameEndPopup is called");
            showGameEndPopup();
            //endGame();
        }, 500);
    }
}

function followRoadAndCollectResidentials(startRow, startCol, collectedResidentials) {
    const queue = [{ row: startRow, col: startCol }];
    const visited = new Set([`${startRow},${startCol}`]);

    while (queue.length > 0) {
        const { row, col } = queue.shift();

        const surroundings = checkSurroundings(row, col);
        for (let i = 0; i < surroundings.length; i++) {
            const s = surroundings[i];
            if (!visited.has(`${s.row},${s.col}`)) {
                if (s.type === 'residential') {
                    collectedResidentials.add(`${s.row},${s.col}`);
                } else if (s.type === 'road') {
                    queue.push(s);
                }
                visited.add(`${s.row},${s.col}`);
            }
        }
    }
}

// function endGame() {
//     //alert('Game Over! Returning to the main menu.');
//     showGameOverModal2();
//     window.location.href = '../html/index.html';
// }


// function showGameOverModal() {
//     return new Promise((resolve) => {
//         $('#gameOverModal').modal('show');
//         $('#continueBtn').on('click', function () {
//             $('#gameOverModal').modal('hide');
//         });
//         $('#gameOverModal').on('hidden.bs.modal', function () {
//             resolve();
//         });
//     });
// }

// function showGameOverModal2() {
//     return new Promise((resolve) => {
//         $('#gameOverModal2').modal('show');
//         $('#continueBtn').on('click', function () {
//             $('#gameOverModal2').modal('hide');
//         });
//         $('#gameOverModal2').on('hidden.bs.modal', function () {
//             resolve();
//         });
//     });
// }


function redirectToHomePage() {
   
    window.location.href = '/';
    
}

function checkGameEndCondition() {
    console.log("checking end game condition");
    // Add your game end conditions here
    if (consecutiveDeficitTurns >= maxDeficitTurns || points < 0) {
        //showGameEndPopup();
        endGame();
    }
}

function endGame() {
    console.log("end game function called");
    buildMode = false;
    demolishMode = false;
    showGameEndPopup();
}

// Function to show game end popup
function showGameEndPopup() {
    console.log("Showing game end popup");
    const popupHtml = `
        <div id="game-end-popup" style="
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
                <h2 style="color: var(--primary-color);">Game Over</h2>
                <p>Game Over! You have had a deficit for 20 consecutive turns.</p>
                <div style="margin-top: 1rem;">
                 <a href="index.html"><button id="game-over-ok" class="button">OK</button></a>
                    
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', popupHtml);

    // document.getElementById('game-over-ok').addEventListener('click', () => {
    //     document.getElementById('game-end-popup').remove();
    //     redirectToHomePage();  // Optionally redirect or reload the page
    // });
    const okButton = document.getElementById('game-over-ok');
    if (okButton) {
        console.log("OK button found");
    } else {
        console.log("OK button not found");
    }

    // Add event listener to the OK button
    okButton.addEventListener('click', () => {
        document.getElementById('game-end-popup').remove();
        redirectToHomePage();
    });

}

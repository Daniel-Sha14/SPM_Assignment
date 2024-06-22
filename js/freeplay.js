document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById('freeplaygrid');
  const scoreCounter = document.getElementById('score');

  let selectedBuildings = [];
  let points = 0;
  let gridSize = 5;


  function createGrid(size) {
    grid.innerHTML = '';
    grid.style.gridTemplateColumns = `repeat(${size}, 50px)`;
    grid.style.gridTemplateRows = `repeat(${size}, 50px)`;

    for (let i = 0; i < size * size; i++) {

      const cell = document.createElement('div');

      cell.classList.add('grid-cell');

      cell.dataset.index = i;

      cell.addEventListener('click', () => placeBuilding(cell));

      grid.appendChild(cell);
    }
  }

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

  function placeBuilding(cell) {
    if (cell.classList.contains('clicked')) return;

    cell.classList.add('clicked');
    points += 10;
    scoreCounter.textContent = points;

    const index = parseInt(cell.dataset.index);
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;

    if (row === 0 || row === gridSize - 1 || col === 0 || col === gridSize - 1) {
      //expandCity();
    }
  }

  function expandCity() {
    gridSize += 5;
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
    document.getElementById('description').innerText = building[buildingType].description;
  };


  window.saveGame = function() {
    alert('Game Saved!');
  };

  window.exitGame = function() {
    window.location.href = '../index.html';
  };

  createGrid(gridSize);
});

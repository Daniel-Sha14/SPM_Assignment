const express = require('express');
const sql = require('mssql');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const dbConfig = require('./sqlConfig');

sql.connect(dbConfig, err => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('SQL Server connected...');
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
app.post('/save-game', (req, res) => {
    const { gridSize, buildingsGrid, points, coins, turnNumber } = req.body;
    const buildingsGridString = JSON.stringify(buildingsGrid);

    const query = `INSERT INTO game_saves (grid_size, buildings_grid, points, coins, turn_number) 
                   VALUES (@gridSize, @buildingsGrid, @points, @coins, @turnNumber)`;

    const request = new sql.Request();
    request.input('gridSize', sql.Int, gridSize);
    request.input('buildingsGrid', sql.NVarChar(sql.MAX), buildingsGridString);
    request.input('points', sql.Int, points);
    request.input('coins', sql.Int, coins);
    request.input('turnNumber', sql.Int, turnNumber);

    request.query(query, (err, result) => {
        if (err) {
            res.status(500).json({ status: 'error', message: 'Error saving game' });
            console.error('Error saving game:', err);
            return;
        }
        res.status(200).json({ status: 'success', message: 'Game saved successfully' });
    });
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
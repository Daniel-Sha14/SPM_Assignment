const express = require('express');
const sql = require('mssql');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const dbConfig = require('./sqlConfig');
const JWT_SECRET = 'your_secret_key_here'; 

sql.connect(dbConfig, err => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('SQL Server connected...');
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'index.html'));
});

app.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;
    console.log(req.body);
    let hashedPassword = password;
    console.log();

    if (!username || !email || !hashedPassword) {
        return res.status(400).json({ status: 'error', message: 'All fields are required' });
    }

    try {
        const hashedPasswords = await bcrypt.hash(hashedPassword, 10);

        const query = `INSERT INTO Users (Username, Email, PasswordHash) VALUES (@username, @email, @password); SELECT SCOPE_IDENTITY() AS UserId;`;

        const request = new sql.Request();
        request.input('username', sql.NVarChar(50), username);
        request.input('email', sql.NVarChar(100), email);
        request.input('password', sql.NVarChar(255), hashedPasswords);

        const result = await request.query(query);
        const userId = result.recordset[0].UserId;

        const token = jwt.sign({ userId, username }, JWT_SECRET);
        res.status(200).json({ status: 'success', message: 'User created successfully', token });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Internal server error' });
        console.error('Internal server error:', err);
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ status: 'error', message: 'All fields are required' });
    }

    try {
        const query = `SELECT UserId, Username, PasswordHash FROM Users WHERE Email = @email`;

        const request = new sql.Request();
        request.input('email', sql.NVarChar(100), email);

        const result = await request.query(query);

        if (result.recordset.length === 0) {
            return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
        }

        const user = result.recordset[0];
        const isPasswordValid = await bcrypt.compare(password, user.PasswordHash);

        if (!isPasswordValid) {
            return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
        }

        const token = jwt.sign({ userId: user.UserId, username: user.Username }, JWT_SECRET);
        res.status(200).json({ status: 'success', message: 'Login successful', token });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Internal server error' });
        console.error('Internal server error:', err);
    }
});

// Middleware to verify token
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];
    console.log('Token:', token);  // Log the token for debugging

    if (!token) {
        console.log('No token provided');  // Log missing token case
        return res.status(403).json({ status: 'error', message: 'No token provided' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            console.log('Failed to authenticate token:', err);  // Log token verification error
            return res.status(500).json({ status: 'error', message: 'Failed to authenticate token' });
        }

        req.userId = decoded.userId;
        req.username = decoded.username;
        console.log('Decoded userId:', req.userId);  // Log the decoded user ID
        next();
    });
};

app.get('/profile', verifyToken, (req, res) => {
    res.status(200).json({ status: 'success', message: 'Profile information', userId: req.userId, username: req.username });
});

app.post('/save-game', verifyToken, async (req, res) => {
    const { gridSize, buildingsGrid, points, coins, turnNumber, gameMode, saveDate, saveName } = req.body;
    const buildingsGridString = JSON.stringify(buildingsGrid);

    try {
        const pool = await sql.connect(dbConfig);
        const transaction = new sql.Transaction(pool);

        await transaction.begin();

        try {
            const insertGameSaveQuery = `
                INSERT INTO game_saves (grid_size, buildings_grid, points, coins, turn_number, gameMode, saveDate) 
                OUTPUT INSERTED.id
                VALUES (@gridSize, @buildingsGrid, @points, @coins, @turnNumber, @gameMode, @saveDate)
            `;

            const insertGameSaveResult = await transaction.request()
                .input('gridSize', sql.Int, gridSize)
                .input('buildingsGrid', sql.NVarChar(sql.MAX), buildingsGridString)
                .input('points', sql.Int, points)
                .input('coins', sql.Int, coins)
                .input('turnNumber', sql.Int, turnNumber)
                .input('gameMode', sql.NVarChar(50), gameMode)
                .input('saveDate', sql.DateTime, saveDate)
                .query(insertGameSaveQuery);

            const gameId = insertGameSaveResult.recordset[0].id;

            console.log('Game ID:', gameId);
            const insertUserEventQuery = `
                INSERT INTO UserEvents (UserId, EventId, saveName)
                VALUES (@userId, @eventId, @saveName)
            `;

            await transaction.request()
                .input('userId', sql.Int, req.userId)
                .input('eventId', sql.Int, gameId)
                .input('saveName', sql.NVarChar(50), saveName)
                .query(insertUserEventQuery);

            await transaction.commit();

            res.status(200).json({ status: 'success', message: 'Game saved successfully', gameId });
        } catch (err) {
            await transaction.rollback();
            res.status(500).json({ status: 'error', message: 'Error saving game' });
            console.error('Error saving game:', err);
        }
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Error saving game' });
        console.error('Error saving game:', err);
    }
});

app.post('/save-game2', verifyToken, async (req, res) => {
    const { gridSize, buildingsGrid, points, coins, turnNumber, gameMode, saveDate } = req.body;
    const buildingsGridString = JSON.stringify(buildingsGrid);

    try {
        const pool = await sql.connect(dbConfig);
        const transaction = new sql.Transaction(pool);

        await transaction.begin();

        try {
            const insertGameSaveQuery = `
                INSERT INTO game_saves (grid_size, buildings_grid, points, coins, turn_number, gameMode, saveDate) 
                OUTPUT INSERTED.id
                VALUES (@gridSize, @buildingsGrid, @points, @coins, @turnNumber, @gameMode, @saveDate)
            `;

            const insertGameSaveResult = await transaction.request()
                .input('gridSize', sql.Int, gridSize)
                .input('buildingsGrid', sql.NVarChar(sql.MAX), buildingsGridString)
                .input('points', sql.Int, points)
                .input('coins', sql.Int, coins)
                .input('turnNumber', sql.Int, turnNumber)
                .input('gameMode', sql.NVarChar(50), gameMode)
                .input('saveDate', sql.DateTime, saveDate)
                .query(insertGameSaveQuery);

            const gameId = insertGameSaveResult.recordset[0].id;

            console.log('Game ID:', gameId);

            await transaction.commit();

            res.status(200).json({ status: 'success', message: 'Game saved successfully', gameId });
        } catch (err) {
            await transaction.rollback();
            res.status(500).json({ status: 'error', message: 'Error saving game' });
            console.error('Error saving game:', err);
        }
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Error saving game' });
        console.error('Error saving game:', err);
    }
});


app.get('/get-games', verifyToken, async (req, res) => {
    try {
        console.log("userID:", req.userId);
        const query = `
            SELECT gs.id, gs.grid_size, gs.buildings_grid, gs.points, gs.coins, gs.turn_number, gs.gameMode, gs.created_at, gs.saveDate, ue.saveName
            FROM game_saves gs
            INNER JOIN UserEvents ue ON gs.id = ue.EventId
            WHERE ue.UserId = @userId
        `;

        const request = new sql.Request();
        request.input('userId', sql.Int, req.userId);

        const result = await request.query(query);

        const games = result.recordset.map(game => ({
            id: game.id,
            gridSize: game.grid_size,
            buildingsGrid: JSON.parse(game.buildings_grid),
            points: game.points,
            coins: game.coins,
            turnNumber: game.turn_number,
            date: game.created_at,
            gameMode: game.gameMode,
            saveDate: game.saveDate,
            saveName: game.saveName
        }));

        res.status(200).json({
            status: 'success',
            games
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Error retrieving games' });
        console.error('Error retrieving games:', err);
    }
});

app.get('/get-high-scores', verifyToken, async (req, res) => {
    try {
        const query = `
            SELECT TOP 10
                u.Username AS playerName,
                hs.playerName AS playerName2,
                gs.points AS score,
                gs.turn_number AS turnNumber,
                gs.saveDate AS date
            FROM highscores hs
            INNER JOIN Users u ON hs.userId = u.UserId
            INNER JOIN game_saves gs ON hs.id = gs.id
            WHERE gs.turn_number > 0 AND gs.gameMode = 'arcade'
            ORDER BY gs.points DESC, gs.saveDate ASC
        `;

        const request = new sql.Request();
        const result = await request.query(query);

        

        const highScores = result.recordset.map(score => ({
            playerName: score.playerName,
            playerName2: score.playerName2,
            score: score.score,
            turnNumber: score.turnNumber,
            date: score.date
        }));

        res.status(200).json({
            status: 'success',
            highScores
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Error retrieving high scores' });
        console.error('Error retrieving high scores:', err);
    }
});

app.post('/create-high-score', verifyToken, async (req, res) => {
    const { gameId, playerName } = req.body;

    if (!gameId) {
        return res.status(400).json({ status: 'error', message: 'Game ID is required' });
    }
    else if (!playerName) {
        playerName = null;
    }

    try {
        // Check if the game save exists
        const gameSaveQuery = `
            SELECT id
            FROM game_saves
            WHERE id = @gameId
        `;

        const request = new sql.Request();
        request.input('gameId', sql.Int, gameId);

        const gameSaveResult = await request.query(gameSaveQuery);

        if (gameSaveResult.recordset.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Game save not found' });
        }

        // Insert the high score
        const insertHighScoreQuery = `
            INSERT INTO highscores (userId, id, playerName)
            VALUES (@userId, @gameId, @playerName)
        `;

        await request
            .input('userId', sql.Int, req.userId)
            .input('playerName', sql.NVarChar, playerName)
            .query(insertHighScoreQuery);
            

        res.status(200).json({ status: 'success', message: 'High score created successfully' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Internal server error' });
        console.error('Internal server error:', err);
    }
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
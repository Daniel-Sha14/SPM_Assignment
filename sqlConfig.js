const dbConfig = {
    user: 'game',
    password: '123',
    server: 'localhost', // Ensure this is correctly set as a string
    port: 1433,
    database: 'game_saves',
    options: {
        
        trustServerCertificate: true // Use this for local development
    }
};

module.exports = dbConfig;

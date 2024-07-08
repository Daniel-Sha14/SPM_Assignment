const dbConfig = {
    user: 'game',
    password: '123',
    server: 'localhost', 
    port: 1433,
    database: 'game_saves',
    options: {
        
        trustServerCertificate: true 
    }
};

module.exports = dbConfig;

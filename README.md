# SPM_Assignment

# Creating Database and Account Credentials

Database Name: game_saves
account name: game
account password: 123


# Creating SQL Tables:

1. 
CREATE TABLE game_saves (
    id INT IDENTITY(1,1) PRIMARY KEY,
    grid_size INT NOT NULL,
    buildings_grid NVARCHAR(MAX) NOT NULL,
    points INT NOT NULL,
    coins INT NOT NULL,
    turn_number INT NOT NULL,
    created_at DATETIME NULL,
    gameMode NVARCHAR(MAX) NULL
);

2. 
CREATE TABLE Users (
    UserId INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(50) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    Email NVARCHAR(100) NOT NULL UNIQUE,
    CreatedAt DATETIME DEFAULT GETDATE()
);

3.
CREATE TABLE UserEvents (
    UserEventId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    EventId INT NOT NULL,
    FOREIGN KEY (UserId) REFERENCES Users(UserId),
    FOREIGN KEY (EventId) REFERENCES game_saves(id)
);

# Game Saves Database Setup

## Database and Account Credentials

- **Database Name**: `game_saves`
- **Account Name**: `game`
- **Account Password**: `123`

## SQL Tables Creation

### 1. Creating the `game_saves` Table

```sql
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
```

### 2. Creating the Users Table

```sql
CREATE TABLE Users (
    UserId INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(50) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    Email NVARCHAR(100) NOT NULL UNIQUE,
    CreatedAt DATETIME DEFAULT GETDATE()
);
```
### 3. Creating the UserSaves Table

```sql
CREATE TABLE UserEvents (
    UserEventId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    EventId INT NOT NULL,
    FOREIGN KEY (UserId) REFERENCES Users(UserId),
    FOREIGN KEY (EventId) REFERENCES game_saves(id)
);
```
### 4. Creating the highscores Table

```sql
CREATE TABLE highscores (
    userId INT NOT NULL,
    id INT NOT NULL,
    PRIMARY KEY (userId, id),
    FOREIGN KEY (userId) REFERENCES Users(UserId),
    FOREIGN KEY (id) REFERENCES game_saves(id)
);
```


### Music Credits

**Title:** Nuvole Bianche  
**Artist:** Ludovico Einaudi  
**Album:** Una Mattina  
**Year of Release:** 2004  


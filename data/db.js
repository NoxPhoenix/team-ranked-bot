const Promise = require('bluebird');
const sqlite3 = require('sqlite3');

const config = require('../config.json');

const db = new sqlite3.Database('./teamRanked.db');

const dbAsync = Promise.promisifyAll(db);

function initiatePlayersTable () {
  return dbAsync.runAsync(`CREATE TABLE IF NOT EXISTS players(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    discordId TEXT NOT NULL UNIQUE,
    discordDiscriminator TEXT NOT NULL UNIQUE,
    defaultPlatform TEXT,
    steamId TEXT UNIQUE,
    psnId TEXT UNIQUE,
    xboxId TEXT UNIQUE,
    team TEXT,
    FOREIGN KEY(team) REFERENCES teams(name)
  )`)
    .then(() => console.log('players initiated'));
}

function initiateRanksTable () {
  return dbAsync.runAsync(`CREATE TABLE IF NOT EXISTS ranks(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    discordId TEXT NOT NULL,
    dateOfValidity DATETIME DEFAULT CURRENT_TIMESTAMP,
    ranked1v1MMR INTEGER,
    ranked1v1Tier INTEGER,
    ranked1v1Division INTEGER,
    ranked2v2MMR INTEGER,
    ranked2v2Tier INTEGER,
    ranked2v2Division INTEGER,
    ranked3v3MMR INTEGER,
    ranked3v3Tier INTEGER,
    ranked3v3Division INTEGER,
    rankedSolo3v3MMR INTEGER,
    rankedSolo3v3Tier INTEGER,
    rankedSolo3v3Division INTEGER,
    rankSignature TEXT
  )`);
}

function initiateTeamsTable () {
  return dbAsync.runAsync(`CREATE TABLE IF NOT EXISTS teams(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    captain TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL UNIQUE,
    division INTEGER NOT NULL DEFAULT 0,
    playerTwo TEXT,
    playerThree TEXT,
    playerFour TEXT,
    skillRating INTEGER NOT NULL DEFAULT 1000,
    dateCreated DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(captain) REFERENCES players(discordId)
  )`);
}

function initiateMatchesTable () {
  return dbAsync.runAsync(`CREATE TABLE IF NOT EXISTS matches(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teamOne TEXT NOT NULL,
    teamTwo TEXT NOT NULL,
    division INTEGER NOT NULL,
    seriesScore TEXT,
    dateOfValidity DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(teamOne) REFERENCES teams(id)
    FOREIGN KEY(teamTwo) REFERENCES teams(id)
  )`);
}


// TODO: Refactor to separate the ranks db, or relate discordId to players and separate config db
function bootStrap () {
  return Promise.all([initiateTeamsTable(), initiateRanksTable(), initiatePlayersTable(), initiateMatchesTable()])
    .then(() => console.log('database initiated'))
    .catch(err => console.log(err));
}

bootStrap();

const playersColumns = ['discordId', 'discordDiscriminator', 'defaultPlatform', 'steamId', 'psnId', 'xboxId'];
const ranksColumns = [
  'discordId',
  'ranked1v1MMR',
  'ranked1v1Tier',
  'ranked1v1Division',
  'ranked2v2MMR',
  'ranked2v2Tier',
  'ranked2v2Division',
  'rankedSolo3v3MMR',
  'rankedSolo3v3Tier',
  'rankedSolo3v3Division',
  'ranked3v3MMR',
  'ranked3v3Tier',
  'ranked3v3Division',
  'rankSignature',
];

function parseRankData (rankData) {
  const currentRanks = rankData.rankedSeasons[config.currentSeasonId];
  const ranks = [];
  for (let i = 10; i < 14; i += 1) {
    ranks.push(`"${currentRanks[i].rankPoints}"`, `"${currentRanks[i].tier}"`, `"${currentRanks[i].division}"`);
  }
  ranks.push(`"${rankData.signatureUrl}"`);
  return ranks.join(', ');
}

module.exports = {

  createTeam (teamName, captain, division = 0, players = []) {
    const [playerTwo = null, playerThree = null, playerFour = null] = [...players];
    return dbAsync.runAsync(`INSERT INTO teams (teamName, captain, division, playerTwo, playerThree, playerFour)
    VALUES ("${teamName}", "${captain}", "${division}", "${playerTwo}", "${playerThree}", "${playerFour})"`)
      .then(() => {
        const playersToUpdate = [captain, ...players];
        playersToUpdate.map((playerId) => {
          return dbAsync.runAsync(`UPDATE players SET team = "${teamName}" WHERE discordId = "${playerId}"`);
        });
      });
  },

  getTeamByTeamName (teamName) {
    return dbAsync.getAsync(`SELECT * FROM teams WHERE teamName = "${teamName}"`);
  },

  deleteTeamByName (teamName) {
    return dbAsync.runAsync(`DELETE FROM teams WHERE teamName = "${teamName}"`);
  },

  createNewMatch (teamOne, teamTwo, division) {
    return dbAsync.runAsync(`INSERT INTO matches (teamOne, teamTwo, division)
    VALUES ("${teamOne}", "${teamTwo}", "${division}")`);
  },

  updateMatchSeriesScoreById (id, seriesScore) {
    return dbAsync.runAsync(`UPDATE matches SET seriesScore = "${seriesScore}" WHERE id = "${id}"`);
  },

  updatePlayerProfile (discordId, platform, id) {
    return dbAsync.runAsync(`UPDATE players SET ${platform}Id = "${id}",
      defaultPlatform = "${platform}" WHERE discordId = "${discordId}"`);
  },

  createPlayerProfile (member, platform, id) {
    const { user } = member;
    const platformId = `${platform}Id`;
    return dbAsync.runAsync(`INSERT INTO players (discordId, discordDiscriminator, defaultPlatform, ${platformId})
      VALUES ("${member.id}", "${user.discriminator}", "${platform}", "${id}")`);
  },

  getLatestRankCache (discordId) {
    return dbAsync.getAsync(`SELECT * FROM ranks
      WHERE discordId = "${discordId}" ORDER BY dateOfValidity DESC LIMIT 1`);
  },

  getPlayerProfileFromDiscorId (discordId) {
    return dbAsync.getAsync(`SELECT * FROM players WHERE discordId = "${discordId}"`);
  },

  createNewRankCache (discordId, rankData) {
    console.log(rankData);
    const rankString = parseRankData(rankData);
    const ranksColumnsStrings = ranksColumns.join(', ');
    return dbAsync.runAsync(`INSERT INTO ranks (${ranksColumnsStrings}) VALUES ("${discordId}", ${rankString})`);
  },

  createNewRankCacheAndReturn (discordId, rankData) {
    return this.createNewRankCache(discordId, rankData)
      .then(() => this.getLatestRankCache(discordId));
  },
};

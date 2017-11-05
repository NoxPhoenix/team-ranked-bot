const _ = require('lodash');

const db = require('../data/db');
const { rlStats } = require('../utils');

function determineDivision (ranks) {
  const rankAvg = _.sum(ranks) / ranks.length;
  switch (true) {
    case (rankAvg > 1400):
      return 1;
    case (rankAvg > 1250):
      return 2;
    case (rankAvg > 950):
      return 3;
    case (rankAvg > 750):
      return 4;
    default:
      return 5;
  }
}

function getAllRanks (players) {
  return Promise.map(players, playerId => rlStats.getRankFromMemberWithProfile(playerId));
}

module.exports = {
  createTeamInitial (teamName, captain) {
    return db.createTeam(teamName, captain)
  },

  createTeamWithAllPlayers (teamName, captain, players) {
    return getAllRanks([captain, ...players])
      .then(rankObjects => _.map(rankObjects, 'ranked3v3MMR'))
      .then(ranks => determineDivision(ranks))
      .then(division => db.createTeam(teamName, captain, division, players))
      .then(() => db.getTeamByTeamName(teamName));
  },

  getAllPlayersByTeamName (teamName) {
    return db.getTeamByTeamName(teamName)
      .then(team => _.pull([team.captain, team.playerTwo, team.playerThree, team.playerFour], null));
  },

  updateTeamDivision (teamName) {

  },
};

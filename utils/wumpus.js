const config = require('../config');

module.exports = {
  commandAndArgsFromMessage ({ content }) {
    const args = content.slice(config.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    return { command, args };
  },

  roleFromGuildByName () {

  },
};

const teams = require('../../services/teamManagment');
const { rlStats: stats, wumpus } = require('../../utils');

const commands = {
  register ({ args, message }) {
    if (args.length < 2) return message.reply('please include a PLATFORM and ID');
    return stats.setPlayerProfile(message.member, args[0].toLowerCase(), args[1])
      .then(({ rankSignature }) => message.reply({ file: rankSignature }))
      .catch((err) => {
        message.reply(err.message);
        console.log(err);
      });
  },

  new ({ args, message }) {
    const teamName = args.join();
    return teams.createTeam(teamName, message.author)
      .then(() => {
        message.reply(`Team: ${teamName} successfully created with ${message.author} as the captain!
        Use !invite to invite other registered players to the team`);
      })
      .catch('Error making team, make sure you are already not a team captain or that the team doesn\'t already exist!');
  },
};

module.exports = {

  run (message) {
    console.log('command called!');
    const { command, args } = wumpus.commandAndArgsFromMessage(message);
    console.log(command);
    console.log(args);
    if (!commands[command]) return;
    commands[command]({ args, message });
  },
};

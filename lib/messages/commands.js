const { api, wumpus } = require('../../utils');

const commands = {
  addMe () {

  };
};

module.exports = {

  run (message) {
    const { command, args } = wumpus.commandAndArgsFromMessage(message);
    if (!commands[command]) return;
    commands[command]({ args, message });
  },
};

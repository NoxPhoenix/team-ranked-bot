const Discord = require('discord.js');

global.admin = {};

const { Token } = require('./config.json');

const bot = new Discord.Client();

// Listener for RSS Feed changes for the podcast
require('./utils/admin');

require('./handlers/messages')(bot);
require('./handlers/voiceChannels')(bot);
require('./handlers/server')(bot);


bot.on('ready', () => {
  console.log('Ready for team battles!');
});


bot.login(Token);


const Discord = require('discord.js');

const { Token } = require('./config.json');

const bot = new Discord.Client();

require('./handlers/messages')(bot);
// require('./handlers/voiceChannels')(bot);
// require('./handlers/server')(bot);


bot.on('ready', () => {
  console.log('Ready for team battles!');
});


bot.login(Token);


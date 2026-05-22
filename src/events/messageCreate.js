const { GuildConfig, MessageStat } = require('../database/db');

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    // Ignore bots and DMs
    if (message.author.bot || !message.guild) return;

    const config = await GuildConfig.findByPk(message.guild.id);
    if (!config || !config.trackerEnabled) return;

    // Increment message count for this user in this channel
    const [stat] = await MessageStat.findOrCreate({
      where: {
        guildId: message.guild.id,
        userId: message.author.id,
        channelId: message.channel.id,
      },
      defaults: { count: 0 },
    });
    stat.count += 1;
    await stat.save();
  },
};

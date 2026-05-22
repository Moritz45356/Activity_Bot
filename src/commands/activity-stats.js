const { SlashCommandBuilder } = require('discord.js');
const { hasAdminRole } = require('../utils/permissions');
const { MessageStat } = require('../database/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('activity-stats')
    .setDescription('Nachrichten-Statistiken anzeigen')
    .addSubcommand(s =>
      s.setName('server')
        .setDescription('Server-weite Top-15 der aktivsten User')
    )
    .addSubcommand(s =>
      s.setName('user')
        .setDescription('Statistiken eines bestimmten Users anzeigen')
        .addUserOption(o =>
          o.setName('user')
            .setDescription('Welcher User?')
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const isAdmin = await hasAdminRole(interaction.member, interaction.guildId);
    if (!isAdmin) {
      return interaction.reply({ content: '\u274C Du hast keine Berechtigung.', ephemeral: true });
    }
    await interaction.deferReply({ ephemeral: true });

    const sub = interaction.options.getSubcommand();

    if (sub === 'server') {
      const stats = await MessageStat.findAll({
        where: { guildId: interaction.guildId },
      });

      // Aggregate total messages per user across all channels
      const userTotals = {};
      for (const s of stats) {
        userTotals[s.userId] = (userTotals[s.userId] || 0) + s.count;
      }

      const sorted = Object.entries(userTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15);

      const totalMessages = Object.values(userTotals).reduce((a, b) => a + b, 0);

      const list = sorted.length > 0
        ? sorted.map(([uid, cnt], i) => {
            const medal = i === 0 ? '\uD83E\uDD47' : i === 1 ? '\uD83E\uDD48' : i === 2 ? '\uD83E\uDD49' : `**${i + 1}.**`;
            return `${medal} <@${uid}> \u2013 **${cnt.toLocaleString()}** Nachrichten`;
          }).join('\n')
        : 'Noch keine Daten. Stelle sicher, dass der Message-Tracker aktiviert ist.';

      return interaction.editReply({
        flags: 1 << 15,
        components: [{
          type: 17,
          accent_color: 0x5865F2,
          components: [
            { type: 10, content: '# \uD83D\uDCCA Server Aktivit\u00E4ts-Ranking' },
            { type: 14, spacing: 1, divider: true },
            { type: 10, content: `**Gesamt getrackte Nachrichten:** ${totalMessages.toLocaleString()}` },
            { type: 14, spacing: 1, divider: true },
            { type: 10, content: list },
          ],
        }],
      });
    }

    if (sub === 'user') {
      const target = interaction.options.getUser('user');

      const stats = await MessageStat.findAll({
        where: { guildId: interaction.guildId, userId: target.id },
        order: [['count', 'DESC']],
        limit: 10,
      });

      const total = stats.reduce((acc, s) => acc + s.count, 0);

      const list = stats.length > 0
        ? stats.map(s => `<#${s.channelId}> \u2013 **${s.count.toLocaleString()}** Nachrichten`).join('\n')
        : 'Keine Daten f\u00FCr diesen User.';

      return interaction.editReply({
        flags: 1 << 15,
        components: [{
          type: 17,
          accent_color: 0x5865F2,
          components: [
            { type: 10, content: `# \uD83D\uDCCA Stats von ${target.username}` },
            { type: 14, spacing: 1, divider: true },
            { type: 10, content: `**Gesamt:** ${total.toLocaleString()} Nachrichten` },
            { type: 14, spacing: 1, divider: true },
            { type: 10, content: `**Top Channels:**\n${list}` },
          ],
        }],
      });
    }
  },
};

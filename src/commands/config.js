const { SlashCommandBuilder } = require('discord.js');
const { hasAdminRole, getConfig } = require('../utils/permissions');
const { scheduleForGuild } = require('../systems/activityScheduler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Bot-Konfiguration verwalten')
    .addSubcommand(s =>
      s.setName('view').setDescription('Aktuelle Einstellungen anzeigen')
    )
    .addSubcommand(s =>
      s.setName('set')
        .setDescription('Eine Einstellung \u00E4ndern')
        .addStringOption(o =>
          o.setName('key')
            .setDescription('Welche Einstellung?')
            .setRequired(true)
            .addChoices(
              { name: 'Intervall (Minuten)', value: 'interval' },
              { name: 'Reaktions-Emoji', value: 'emoji' },
              { name: 'Reaktionszeit (Minuten)', value: 'reactiontime' },
              { name: 'Message-Tracker an/aus', value: 'tracker' },
            )
        )
        .addStringOption(o =>
          o.setName('wert').setDescription('Neuer Wert').setRequired(true)
        )
    ),

  async execute(interaction, client) {
    const isAdmin = await hasAdminRole(interaction.member, interaction.guildId);
    if (!isAdmin) {
      return interaction.reply({ content: '\u274C Du hast keine Berechtigung.', ephemeral: true });
    }
    await interaction.deferReply({ ephemeral: true });

    const config = await getConfig(interaction.guildId);
    const sub = interaction.options.getSubcommand();

    if (sub === 'view') {
      return interaction.editReply({
        flags: 1 << 15,
        components: [{
          type: 17,
          accent_color: 0x5865F2,
          components: [
            { type: 10, content: '# \u2699\uFE0F Aktuelle Konfiguration' },
            { type: 14, spacing: 1, divider: true },
            { type: 10, content: [
              `**Admin-Rolle:** ${config.adminRoleId ? `<@&${config.adminRoleId}>` : '\u274C Nicht gesetzt'}`,
              `**Activity-Channel:** ${config.activityChannelId ? `<#${config.activityChannelId}>` : '\u274C Nicht gesetzt'}`,
              `**Admin-Log:** ${config.adminLogChannelId ? `<#${config.adminLogChannelId}>` : '\u274C Nicht gesetzt'}`,
              `**Absence-Channel:** ${config.absenceChannelId ? `<#${config.absenceChannelId}>` : '\u274C Nicht gesetzt'}`,
              `**Check-Intervall:** ${config.activityInterval} Minuten`,
              `**Reaktions-Emoji:** ${config.activityReactionEmoji}`,
              `**Reaktionszeit:** ${config.activityReactionTime} Minuten`,
              `**Message-Tracker:** ${config.trackerEnabled ? '\u2705 Aktiv' : '\u274C Deaktiviert'}`,
            ].join('\n') },
            { type: 14, spacing: 1, divider: true },
            { type: 10, content: '-# \u00C4ndern mit `/config set`' },
          ],
        }],
      });
    }

    if (sub === 'set') {
      const key = interaction.options.getString('key');
      const value = interaction.options.getString('wert');

      switch (key) {
        case 'interval': {
          const v = parseInt(value);
          if (isNaN(v) || v < 10) {
            return interaction.editReply({ content: '\u274C Ung\u00FCltiger Wert. Minimum ist 10 Minuten.' });
          }
          config.activityInterval = v;
          scheduleForGuild(client, config);
          break;
        }
        case 'emoji':
          config.activityReactionEmoji = value.trim();
          break;
        case 'reactiontime': {
          const v = parseInt(value);
          if (isNaN(v) || v < 5) {
            return interaction.editReply({ content: '\u274C Ung\u00FCltiger Wert. Minimum ist 5 Minuten.' });
          }
          config.activityReactionTime = v;
          break;
        }
        case 'tracker':
          config.trackerEnabled = ['an', 'true', 'yes', '1', 'ein'].includes(value.toLowerCase());
          break;
      }

      await config.save();
      return interaction.editReply({
        flags: 1 << 15,
        components: [{
          type: 17,
          accent_color: 0x57F287,
          components: [
            { type: 10, content: `\u2705 **${key}** wurde auf \`${value}\` gesetzt.` },
          ],
        }],
      });
    }
  },
};

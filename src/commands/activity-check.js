const { SlashCommandBuilder } = require('discord.js');
const { hasAdminRole } = require('../utils/permissions');
const { triggerActivityCheck } = require('../systems/activityScheduler');
const { ActivityCheck } = require('../database/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('activity-check')
    .setDescription('Aktivit\u00E4tschecks verwalten')
    .addSubcommand(s =>
      s.setName('now')
        .setDescription('Starte sofort einen Aktivit\u00E4tscheck')
    )
    .addSubcommand(s =>
      s.setName('history')
        .setDescription('Zeige die letzten 10 Aktivit\u00E4tschecks')
    ),

  async execute(interaction, client) {
    const isAdmin = await hasAdminRole(interaction.member, interaction.guildId);
    if (!isAdmin) {
      return interaction.reply({ content: '\u274C Du hast keine Berechtigung.', ephemeral: true });
    }
    await interaction.deferReply({ ephemeral: true });

    const sub = interaction.options.getSubcommand();

    if (sub === 'now') {
      await triggerActivityCheck(client, interaction.guildId);
      return interaction.editReply({
        flags: 1 << 15,
        components: [{
          type: 17,
          accent_color: 0x57F287,
          components: [
            { type: 10, content: '# \u2705 Aktivit\u00E4tscheck gestartet' },
            { type: 14, spacing: 1, divider: true },
            { type: 10, content: 'Der Aktivit\u00E4tscheck wurde in den konfigurierten Channel gepostet.' },
          ],
        }],
      });
    }

    if (sub === 'history') {
      const checks = await ActivityCheck.findAll({
        where: { guildId: interaction.guildId },
        order: [['createdAt', 'DESC']],
        limit: 10,
      });

      const list = checks.length > 0
        ? checks.map((c, i) => {
            const ts = Math.floor(new Date(c.createdAt).getTime() / 1000);
            const status = c.active ? '\uD83D\uDFE1 Aktiv' : '\u2705 Beendet';
            return `**${i + 1}.** <t:${ts}:f> \u2013 ${status}`;
          }).join('\n')
        : 'Noch keine Aktivit\u00E4tschecks auf diesem Server.';

      return interaction.editReply({
        flags: 1 << 15,
        components: [{
          type: 17,
          accent_color: 0x5865F2,
          components: [
            { type: 10, content: '# \uD83D\uDCCB Check-Verlauf (letzte 10)' },
            { type: 14, spacing: 1, divider: true },
            { type: 10, content: list },
          ],
        }],
      });
    }
  },
};

const { SlashCommandBuilder } = require('discord.js');
const { hasAdminRole } = require('../utils/permissions');
const { Absence } = require('../database/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('absences')
    .setDescription('Abmeldungen verwalten (Admin)')
    .addSubcommand(s =>
      s.setName('list')
        .setDescription('Alle genehmigten Abmeldungen anzeigen')
    )
    .addSubcommand(s =>
      s.setName('pending')
        .setDescription('Ausstehende Abmeldungen anzeigen')
    )
    .addSubcommand(s =>
      s.setName('history')
        .setDescription('Alle Abmeldungen (auch abgelehnte) anzeigen')
    ),

  async execute(interaction) {
    const isAdmin = await hasAdminRole(interaction.member, interaction.guildId);
    if (!isAdmin) {
      return interaction.reply({ content: '\u274C Du hast keine Berechtigung.', ephemeral: true });
    }
    await interaction.deferReply({ ephemeral: true });

    const sub = interaction.options.getSubcommand();

    if (sub === 'list') {
      const absences = await Absence.findAll({
        where: { guildId: interaction.guildId, status: 'approved' },
        order: [['createdAt', 'DESC']],
        limit: 20,
      });
      const list = absences.length > 0
        ? absences.map(a =>
            `<@${a.userId}> \u2013 **${a.fromDate}** bis **${a.toDate}**\n_${a.reason}_`
          ).join('\n\n')
        : 'Keine aktiven Abmeldungen.';

      return interaction.editReply({
        flags: 1 << 15,
        components: [{
          type: 17,
          accent_color: 0x57F287,
          components: [
            { type: 10, content: `# \uD83D\uDCCB Genehmigte Abmeldungen (${absences.length})` },
            { type: 14, spacing: 1, divider: true },
            { type: 10, content: list },
          ],
        }],
      });
    }

    if (sub === 'pending') {
      const absences = await Absence.findAll({
        where: { guildId: interaction.guildId, status: 'pending' },
        order: [['createdAt', 'ASC']],
      });
      const list = absences.length > 0
        ? absences.map(a =>
            `**ID ${a.id}** \u2013 <@${a.userId}>\n**${a.fromDate}** \u2013 **${a.toDate}** | _${a.reason}_`
          ).join('\n\n')
        : 'Keine ausstehenden Abmeldungen. \u2705';

      return interaction.editReply({
        flags: 1 << 15,
        components: [{
          type: 17,
          accent_color: absences.length > 0 ? 0xFEE75C : 0x57F287,
          components: [
            { type: 10, content: `# \u23F3 Ausstehende Abmeldungen (${absences.length})` },
            { type: 14, spacing: 1, divider: true },
            { type: 10, content: list },
            ...(absences.length > 0 ? [
              { type: 14, spacing: 1, divider: true },
              { type: 10, content: '-# Best\u00E4tige Abmeldungen \u00FCber die Buttons im Absence-Channel.' },
            ] : []),
          ],
        }],
      });
    }

    if (sub === 'history') {
      const absences = await Absence.findAll({
        where: { guildId: interaction.guildId },
        order: [['createdAt', 'DESC']],
        limit: 20,
      });
      const statusEmoji = { approved: '\u2705', rejected: '\u274C', pending: '\u23F3' };
      const list = absences.length > 0
        ? absences.map(a =>
            `${statusEmoji[a.status]} <@${a.userId}> | **${a.fromDate}** \u2013 **${a.toDate}** | _${a.reason}_`
          ).join('\n')
        : 'Noch keine Abmeldungen auf diesem Server.';

      return interaction.editReply({
        flags: 1 << 15,
        components: [{
          type: 17,
          accent_color: 0x5865F2,
          components: [
            { type: 10, content: `# \uD83D\uDDC2\uFE0F Abmeldungs-Verlauf (letzte 20)` },
            { type: 14, spacing: 1, divider: true },
            { type: 10, content: list },
          ],
        }],
      });
    }
  },
};

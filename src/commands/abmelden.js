const { SlashCommandBuilder } = require('discord.js');
const { Absence, GuildConfig } = require('../database/db');
const { buildAbsenceRequestMessage } = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('abmelden')
    .setDescription('Melde dich f\u00FCr einen Zeitraum ab')
    .addStringOption(o =>
      o.setName('von')
        .setDescription('Startdatum deiner Abwesenheit (z.B. 24.05.2025)')
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName('bis')
        .setDescription('Enddatum deiner Abwesenheit (z.B. 30.05.2025)')
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName('grund')
        .setDescription('Grund deiner Abmeldung')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const config = await GuildConfig.findByPk(interaction.guildId);
    if (!config?.absenceChannelId) {
      return interaction.editReply({
        content: '\u274C Der Bot ist noch nicht eingerichtet. Bitte bitte einen Admin, `/setup` auszuf\u00FChren.',
      });
    }

    const from = interaction.options.getString('von');
    const to = interaction.options.getString('bis');
    const reason = interaction.options.getString('grund');

    // Save to database
    const absence = await Absence.create({
      guildId: interaction.guildId,
      userId: interaction.user.id,
      reason,
      fromDate: from,
      toDate: to,
    });

    // Post to absence channel for admin review
    const absenceChannel = await interaction.guild.channels
      .fetch(config.absenceChannelId)
      .catch(() => null);

    if (!absenceChannel) {
      return interaction.editReply({
        content: '\u274C Der Absence-Channel wurde nicht gefunden. Bitte `/setup` erneut ausf\u00FChren.',
      });
    }

    await absenceChannel.send(
      buildAbsenceRequestMessage(interaction.user, from, to, reason, absence.id)
    );

    // Confirm to the user
    await interaction.editReply({
      flags: 1 << 15,
      components: [{
        type: 17,
        accent_color: 0x57F287,
        components: [
          { type: 10, content: '# \u2705 Abmeldung eingereicht' },
          { type: 14, spacing: 1, divider: true },
          { type: 10, content:
            `Deine Abmeldung wurde erfolgreich eingereicht und wartet auf Admin-Best\u00E4tigung.\n\n` +
            `**Von:** ${from}\n` +
            `**Bis:** ${to}\n` +
            `**Grund:** ${reason}\n\n` +
            `-# Du wirst per DM \u00FCber die Entscheidung informiert.`
          },
        ],
      }],
    });
  },
};

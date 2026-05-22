const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const { GuildConfig } = require('../database/db');
const { scheduleForGuild } = require('../systems/activityScheduler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Richte den Aktivit\u00E4tsbot f\u00FCr diesen Server ein')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addRoleOption(o =>
      o.setName('admin-rolle')
        .setDescription('Rolle f\u00FCr Bot-Verwaltung (kann alle Admin-Commands nutzen)')
        .setRequired(true)
    )
    .addChannelOption(o =>
      o.setName('activity-channel')
        .setDescription('Channel, in dem Aktivit\u00E4tschecks gepostet werden')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addChannelOption(o =>
      o.setName('admin-log')
        .setDescription('Channel f\u00FCr Admin-Logs (Check-Ergebnisse, fehlende User)')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addChannelOption(o =>
      o.setName('absence-channel')
        .setDescription('Channel, in dem Abmeldungs-Anfragen erscheinen')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addIntegerOption(o =>
      o.setName('intervall')
        .setDescription('Check-Intervall in Minuten (Standard: 1440 = 24 Stunden)')
        .setMinValue(10)
        .setMaxValue(43200)
    ),

  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const adminRole = interaction.options.getRole('admin-rolle');
    const activityChannel = interaction.options.getChannel('activity-channel');
    const adminLog = interaction.options.getChannel('admin-log');
    const absenceChannel = interaction.options.getChannel('absence-channel');
    const interval = interaction.options.getInteger('intervall') || 1440;

    // Find or create the guild config
    const [config] = await GuildConfig.findOrCreate({
      where: { guildId: interaction.guildId },
      defaults: { guildId: interaction.guildId },
    });

    config.adminRoleId = adminRole.id;
    config.activityChannelId = activityChannel.id;
    config.adminLogChannelId = adminLog.id;
    config.absenceChannelId = absenceChannel.id;
    config.activityInterval = interval;
    await config.save();

    // Start/restart the scheduler for this guild
    scheduleForGuild(client, config);

    await interaction.editReply({
      flags: 1 << 15,
      components: [{
        type: 17,
        accent_color: 0x57F287,
        components: [
          { type: 10, content: '# \u2705 Setup abgeschlossen' },
          { type: 14, spacing: 1, divider: true },
          { type: 10, content:
            `**Admin-Rolle:** <@&${adminRole.id}>\n` +
            `**Activity-Channel:** <#${activityChannel.id}>\n` +
            `**Admin-Log:** <#${adminLog.id}>\n` +
            `**Absence-Channel:** <#${absenceChannel.id}>\n` +
            `**Check-Intervall:** ${interval} Minuten\n\n` +
            `-# Nutze \`/config set\` um weitere Einstellungen anzupassen.`
          },
        ],
      }],
    });
  },
};

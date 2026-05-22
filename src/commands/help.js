const { SlashCommandBuilder } = require('discord.js');
const { buildHelpMessage } = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Zeigt alle verf\u00FCgbaren Commands an'),

  async execute(interaction) {
    await interaction.reply({ ...buildHelpMessage(), ephemeral: true });
  },
};

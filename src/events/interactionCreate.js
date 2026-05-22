module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction, client);
      } catch (error) {
        console.error(`Error in /${interaction.commandName}:`, error);
        const msg = { content: '\u274C Ein Fehler ist aufgetreten.', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(msg).catch(() => {});
        } else {
          await interaction.reply(msg).catch(() => {});
        }
      }
    }

    // Handle button interactions
    if (interaction.isButton()) {
      if (interaction.customId.startsWith('absence_')) {
        const { handleAbsenceButton } = require('../systems/absenceSystem');
        await handleAbsenceButton(interaction).catch(console.error);
      }
    }
  },
};

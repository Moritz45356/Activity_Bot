const { Absence } = require('../database/db');
const { hasAdminRole } = require('../utils/permissions');

/**
 * Handles the Annehmen/Ablehnen buttons on absence request messages.
 */
async function handleAbsenceButton(interaction) {
  const isAdmin = await hasAdminRole(interaction.member, interaction.guildId);
  if (!isAdmin) {
    return interaction.reply({ content: '\u274C Du hast keine Berechtigung.', ephemeral: true });
  }

  // customId format: absence_approve_<id> or absence_reject_<id>
  const parts = interaction.customId.split('_');
  const action = parts[1]; // 'approve' or 'reject'
  const absenceId = parseInt(parts[2]);

  const absence = await Absence.findByPk(absenceId);
  if (!absence) {
    return interaction.reply({ content: '\u274C Abmeldung nicht gefunden.', ephemeral: true });
  }
  if (absence.status !== 'pending') {
    return interaction.reply({ content: '\u274C Diese Abmeldung wurde bereits bearbeitet.', ephemeral: true });
  }

  absence.status = action === 'approve' ? 'approved' : 'rejected';
  absence.reviewedBy = interaction.user.id;
  await absence.save();

  const approved = absence.status === 'approved';
  const statusText = approved ? '\u2705 Angenommen' : '\u274C Abgelehnt';
  const color = approved ? 0x57F287 : 0xED4245;

  // Update the original message (remove buttons, show result)
  await interaction.update({
    flags: 1 << 15,
    components: [{
      type: 17,
      accent_color: color,
      components: [
        { type: 10, content: `# \uD83D\uDCCB Abmeldung \u2013 ${statusText}` },
        { type: 14, spacing: 1, divider: true },
        { type: 10, content:
          `**User:** <@${absence.userId}>\n` +
          `**Von:** ${absence.fromDate}\n` +
          `**Bis:** ${absence.toDate}\n` +
          `**Grund:** ${absence.reason}\n\n` +
          `**Entscheidung:** ${statusText} von <@${interaction.user.id}>`
        },
      ],
    }],
  });

  // DM the user about the decision
  try {
    const member = await interaction.guild.members.fetch(absence.userId).catch(() => null);
    if (member) {
      await member.send({
        flags: 1 << 15,
        components: [{
          type: 17,
          accent_color: color,
          components: [
            { type: 10, content: `# \uD83D\uDCCB Abmeldung ${statusText}` },
            { type: 14, spacing: 1, divider: true },
            { type: 10, content:
              `Deine Abmeldung auf **${interaction.guild.name}** wurde **${statusText}**.\n\n` +
              `**Zeitraum:** ${absence.fromDate} \u2013 ${absence.toDate}\n` +
              `**Grund:** ${absence.reason}`
            },
          ],
        }],
      });
    }
  } catch {
    // User has DMs disabled
  }
}

module.exports = { handleAbsenceButton };

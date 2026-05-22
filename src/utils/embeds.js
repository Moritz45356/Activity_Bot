/**
 * Components V2 helper functions.
 * All messages use flags: 1 << 15 (IS_COMPONENTS_V2) with Container components.
 * No side stripe = no EmbedBuilder, pure component containers with accent_color.
 */

function textBlock(content) {
  return { type: 10, content }; // TextDisplay
}

function separator(spacing = 1, divider = true) {
  return { type: 14, spacing, divider }; // Separator
}

function container(accent_color, components) {
  return { type: 17, accent_color, components };
}

// ---- Activity Check ----
function buildActivityCheckMessage(emoji, reactionMinutes) {
  return {
    flags: 1 << 15,
    components: [
      container(0x57F287, [
        textBlock('# \uD83D\uDFE2 Aktivit\u00E4tscheck'),
        separator(),
        textBlock(
          `Reagiere mit ${emoji} auf diese Nachricht um deine Aktivit\u00E4t zu best\u00E4tigen.\n` +
          `\n\u23F0 Du hast **${reactionMinutes} Minuten** Zeit zu reagieren.`
        ),
        separator(),
        textBlock('-# Wer nicht reagiert wird per DM benachrichtigt und in den Admin-Logs gelistet.'),
      ]),
    ],
  };
}

// ---- Absence Request (with buttons) ----
function buildAbsenceRequestMessage(user, from, to, reason, absenceId) {
  return {
    flags: 1 << 15,
    components: [
      container(0xFEE75C, [
        textBlock('# \uD83D\uDCCB Neue Abmeldung'),
        separator(),
        textBlock(
          `**User:** <@${user.id}>\n` +
          `**Von:** ${from}\n` +
          `**Bis:** ${to}\n` +
          `**Grund:** ${reason}`
        ),
        separator(),
        {
          type: 1, // ActionRow
          components: [
            { type: 2, style: 3, label: '\u2705 Annehmen', custom_id: `absence_approve_${absenceId}` },
            { type: 2, style: 4, label: '\u274C Ablehnen', custom_id: `absence_reject_${absenceId}` },
          ],
        },
      ]),
    ],
  };
}

// ---- Help Message ----
function buildHelpMessage() {
  return {
    flags: 1 << 15,
    components: [
      container(0x5865F2, [
        textBlock('# \uD83D\uDCD6 Hilfe \u2013 Aktivit\u00E4tssystem'),
        separator(),
        textBlock('## \uD83D\uDEE0\uFE0F Setup & Config'),
        textBlock(
          '`/setup` \u2013 Bot einrichten (Admin-Rolle, Channels, Intervall)\n' +
          '`/config view` \u2013 Aktuelle Einstellungen anzeigen\n' +
          '`/config set interval` \u2013 Check-Intervall \u00E4ndern\n' +
          '`/config set emoji` \u2013 Reaktions-Emoji \u00E4ndern'
        ),
        separator(),
        textBlock('## \u2705 Aktivit\u00E4tschecks'),
        textBlock(
          '`/activity-check now` \u2013 Sofortigen Check starten\n' +
          '`/activity-check history` \u2013 Vergangene Checks anzeigen'
        ),
        separator(),
        textBlock('## \uD83D\uDCCA Aktivit\u00E4tstracking'),
        textBlock(
          '`/activity-stats server` \u2013 Server-weite Top-15\n' +
          '`/activity-stats user @user` \u2013 Stats eines bestimmten Users'
        ),
        separator(),
        textBlock('## \uD83C\uDFD6\uFE0F Abmeldungen'),
        textBlock(
          '`/abmelden` \u2013 Sich abmelden (von / bis / grund)\n' +
          '`/absences list` \u2013 Alle genehmigten Abmeldungen (Admin)\n' +
          '`/absences pending` \u2013 Ausstehende Abmeldungen (Admin)'
        ),
        separator(),
        textBlock('-# Alle Admin-Befehle erfordern die bei /setup eingestellte Admin-Rolle.'),
      ]),
    ],
  };
}

module.exports = {
  textBlock,
  separator,
  container,
  buildActivityCheckMessage,
  buildAbsenceRequestMessage,
  buildHelpMessage,
};

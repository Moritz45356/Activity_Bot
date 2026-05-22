const { GuildConfig, ActivityCheck } = require('../database/db');
const { buildActivityCheckMessage } = require('../utils/embeds');
const { Op } = require('sequelize');

const checkIntervals = new Map(); // guildId -> intervalId

/**
 * Called on bot startup. Loads all guild configs and starts their individual schedulers.
 * Also starts a global 60s ticker to detect expired checks.
 */
async function startActivityScheduler(client) {
  const configs = await GuildConfig.findAll();
  for (const config of configs) {
    scheduleForGuild(client, config);
  }
  setInterval(() => checkExpiredChecks(client), 60 * 1000);
  console.log('\u2705 Activity scheduler started.');
}

/**
 * Schedules the periodic activity check for a specific guild.
 * Clears any existing interval first.
 */
function scheduleForGuild(client, config) {
  if (checkIntervals.has(config.guildId)) {
    clearInterval(checkIntervals.get(config.guildId));
    checkIntervals.delete(config.guildId);
  }
  if (!config.activityChannelId || !config.activityInterval) return;
  const ms = config.activityInterval * 60 * 1000;
  const id = setInterval(() => triggerActivityCheck(client, config.guildId), ms);
  checkIntervals.set(config.guildId, id);
}

/**
 * Sends an activity check message to the configured channel.
 */
async function triggerActivityCheck(client, guildId) {
  const config = await GuildConfig.findByPk(guildId);
  if (!config || !config.activityChannelId) return;

  const channel = await client.channels.fetch(config.activityChannelId).catch(() => null);
  if (!channel) return;

  const emoji = config.activityReactionEmoji || '\u2705';
  const reactionMinutes = config.activityReactionTime || 60;
  const deadline = new Date(Date.now() + reactionMinutes * 60 * 1000);

  const msg = await channel.send(buildActivityCheckMessage(emoji, reactionMinutes));
  await msg.react(emoji).catch(() => {});

  await ActivityCheck.create({
    guildId,
    messageId: msg.id,
    channelId: channel.id,
    deadline,
    active: true,
  });
}

/**
 * Checks for all expired but still-active checks and processes them.
 */
async function checkExpiredChecks(client) {
  const expired = await ActivityCheck.findAll({
    where: { active: true, deadline: { [Op.lt]: new Date() } },
  });
  for (const check of expired) {
    await processExpiredCheck(client, check).catch(console.error);
  }
}

/**
 * For an expired check: find who didn't react, DM them, log to admin channel.
 */
async function processExpiredCheck(client, check) {
  check.active = false;
  await check.save();

  const config = await GuildConfig.findByPk(check.guildId);
  if (!config) return;

  const channel = await client.channels.fetch(check.channelId).catch(() => null);
  if (!channel) return;

  const message = await channel.messages.fetch(check.messageId).catch(() => null);
  if (!message) return;

  const emoji = config.activityReactionEmoji || '\u2705';
  const reaction = message.reactions.cache.get(emoji);
  const reactedUsers = reaction
    ? await reaction.users.fetch().catch(() => new Map())
    : new Map();

  const guild = await client.guilds.fetch(check.guildId).catch(() => null);
  if (!guild) return;

  const members = await guild.members.fetch().catch(() => new Map());
  const missing = [];

  for (const [, member] of members) {
    if (member.user.bot) continue;
    if (!reactedUsers.has(member.id)) {
      missing.push(member);
      // Send DM to missing user
      try {
        await member.send({
          flags: 1 << 15,
          components: [{
            type: 17,
            accent_color: 0xED4245,
            components: [
              { type: 10, content: '# \u26A0\uFE0F Aktivit\u00E4tscheck verpasst' },
              { type: 14, spacing: 1, divider: true },
              { type: 10, content: `Du hast den Aktivit\u00E4tscheck auf **${guild.name}** verpasst.\n\nBitte sei beim n\u00E4chsten Check aktiv, um nicht als inaktiv zu gelten.` },
            ],
          }],
        });
      } catch {
        // User has DMs disabled – silently ignore
      }
    }
  }

  // Send result to admin log channel
  if (config.adminLogChannelId) {
    const logChannel = await client.channels.fetch(config.adminLogChannelId).catch(() => null);
    if (logChannel) {
      const missingList = missing.length > 0
        ? missing.map(m => `<@${m.id}>`).join(', ')
        : 'Alle haben reagiert \u2705';
      await logChannel.send({
        flags: 1 << 15,
        components: [{
          type: 17,
          accent_color: missing.length > 0 ? 0xED4245 : 0x57F287,
          components: [
            { type: 10, content: '# \uD83D\uDCCA Aktivit\u00E4tscheck Ergebnis' },
            { type: 14, spacing: 1, divider: true },
            { type: 10, content:
              `**\u2705 Reagiert:** ${reactedUsers.size - 1}\n` + // -1 because bot reaction counts
              `**\u274C Nicht reagiert:** ${missing.length}\n\n` +
              `**Fehlende User:**\n${missingList}`
            },
          ],
        }],
      });
    }
  }
}

module.exports = { startActivityScheduler, scheduleForGuild, triggerActivityCheck };

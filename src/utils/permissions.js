const { GuildConfig } = require('../database/db');

/**
 * Returns true if the member has the configured admin role or server Administrator permission.
 */
async function hasAdminRole(member, guildId) {
  if (member.permissions.has('Administrator')) return true;
  const config = await GuildConfig.findByPk(guildId);
  if (!config || !config.adminRoleId) return member.permissions.has('ManageGuild');
  return member.roles.cache.has(config.adminRoleId);
}

/**
 * Finds or creates the guild config entry.
 */
async function getConfig(guildId) {
  const [config] = await GuildConfig.findOrCreate({
    where: { guildId },
    defaults: { guildId },
  });
  return config;
}

module.exports = { hasAdminRole, getConfig };

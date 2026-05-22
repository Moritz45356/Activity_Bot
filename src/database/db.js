const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../data/database.sqlite'),
  logging: false,
});

// Guild Config – one entry per server
const GuildConfig = sequelize.define('GuildConfig', {
  guildId: { type: DataTypes.STRING, primaryKey: true },
  adminRoleId: { type: DataTypes.STRING, allowNull: true },
  activityChannelId: { type: DataTypes.STRING, allowNull: true },
  adminLogChannelId: { type: DataTypes.STRING, allowNull: true },
  absenceChannelId: { type: DataTypes.STRING, allowNull: true },
  activityInterval: { type: DataTypes.INTEGER, defaultValue: 1440 }, // minutes (1440 = 24h)
  activityReactionEmoji: { type: DataTypes.STRING, defaultValue: '\u2705' },
  activityReactionTime: { type: DataTypes.INTEGER, defaultValue: 60 }, // minutes to react
  trackerEnabled: { type: DataTypes.BOOLEAN, defaultValue: true },
});

// Message Tracking – per user per channel per guild
const MessageStat = sequelize.define('MessageStat', {
  guildId: { type: DataTypes.STRING, allowNull: false },
  userId: { type: DataTypes.STRING, allowNull: false },
  channelId: { type: DataTypes.STRING, allowNull: false },
  count: { type: DataTypes.INTEGER, defaultValue: 0 },
});

// Activity Checks log
const ActivityCheck = sequelize.define('ActivityCheck', {
  guildId: { type: DataTypes.STRING, allowNull: false },
  messageId: { type: DataTypes.STRING, allowNull: false },
  channelId: { type: DataTypes.STRING, allowNull: false },
  deadline: { type: DataTypes.DATE, allowNull: false },
  active: { type: DataTypes.BOOLEAN, defaultValue: true },
});

// Absence requests
const Absence = sequelize.define('Absence', {
  guildId: { type: DataTypes.STRING, allowNull: false },
  userId: { type: DataTypes.STRING, allowNull: false },
  reason: { type: DataTypes.TEXT, allowNull: false },
  fromDate: { type: DataTypes.STRING, allowNull: false },
  toDate: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
  reviewedBy: { type: DataTypes.STRING, allowNull: true },
});

async function initDB() {
  const fs = require('fs');
  const dataDir = path.join(__dirname, '../../data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  await sequelize.sync({ alter: true });
  console.log('\u2705 Database initialized.');
}

module.exports = { sequelize, GuildConfig, MessageStat, ActivityCheck, Absence, initDB };

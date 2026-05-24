const { Sequelize } = require('sequelize');

function parseBoolean(value) {
  return ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase());
}

function shouldUseSsl() {
  if (process.env.DB_SSL !== undefined) {
    return parseBoolean(process.env.DB_SSL);
  }

  return process.env.NODE_ENV === 'production';
}

function buildSequelizeOptions() {
  const options = {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      underscored: true,
      timestamps: true,
    },
  };

  if (shouldUseSsl()) {
    options.dialectOptions = {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    };
  }

  return options;
}

function createSequelizeInstance() {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (databaseUrl) {
    return new Sequelize(databaseUrl, buildSequelizeOptions());
  }

  const database = process.env.DB_NAME || 'locus_agents_dev';
  const username = process.env.DB_USER || 'postgres';
  const password = process.env.DB_PASSWORD || 'password';
  const host = process.env.DB_HOST || 'localhost';
  const port = Number(process.env.DB_PORT || 5432);

  return new Sequelize(database, username, password, {
    ...buildSequelizeOptions(),
    host,
    port,
  });
}

module.exports = createSequelizeInstance();

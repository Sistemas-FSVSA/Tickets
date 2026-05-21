const sql = require('mssql');

// Función para construir la configuración extrayendo el host y puerto
const buildConfig = (user, password, serverEnv, database) => {
  const config = {
    user,
    password,
    database,
    options: {
      encrypt: false,
      enableArithAbort: true
    }
  };

  if (serverEnv) {
    // Si viene en formato "host,puerto" o "host:puerto"
    const parts = serverEnv.split(/[,:]/);
    config.server = parts[0].trim();
    if (parts.length > 1) {
      config.port = parseInt(parts[1].trim(), 10);
    }
  }

  return config;
};

// Configuración para la base de datos 'tickets'
const configTickets = buildConfig(
  process.env.DB1_USER,
  process.env.DB1_PASSWORD,
  process.env.DB1_SERVER,
  process.env.DB1_DATABASE
);

// Configuración para la base de datos 'sistemas'
const configSistemas = buildConfig(
  process.env.DB2_USER,
  process.env.DB2_PASSWORD,
  process.env.DB2_SERVER,
  process.env.DB2_DATABASE
);

// Función para conectar a una base de datos con reintentos
const connectWithRetry = async (config, retryInterval = 5000) => {
  while (true) {
    try {
      const pool = await new sql.ConnectionPool(config).connect();
      console.log(`Conectado a la base de datos: ${config.database}`);
      return pool;
    } catch (err) {
      console.error(`Error de conexión a la base de datos: ${err}. Reintentando en ${retryInterval / 1000} segundos...`);
      await new Promise(resolve => setTimeout(resolve, retryInterval));
    }
  }
};

// Crear las conexiones para ambas bases de datos
const ticketsPoolPromise = connectWithRetry(configTickets);
const sistemasPoolPromise = connectWithRetry(configSistemas);

module.exports = {
  sql,
  ticketsPoolPromise,
  sistemasPoolPromise
};

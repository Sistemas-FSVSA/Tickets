const sql = require('mssql');

// Configuración para la base de datos 'tickets'
const configTickets = {
  user: process.env.DB1_USER,
  password: process.env.DB1_PASSWORD,
  server: process.env.DB1_SERVER,
  database: process.env.DB1_DATABASE,
  options: {
    encrypt: false,
    enableArithAbort: true
  }
};

// Configuración para la base de datos 'sistemas'
const configSistemas = {
  user: process.env.DB2_USER,
  password: process.env.DB2_PASSWORD,
  server: process.env.DB2_SERVER,
  database: process.env.DB2_DATABASE,
  options: {
    encrypt: false,
    enableArithAbort: true
  }
};

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

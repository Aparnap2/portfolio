const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

client.connect()
  .then(() => console.log('Connected to PostgreSQL database'))
  .then(() => client.query('UPDATE your_table SET your_column = your_value WHERE your_condition'))
  .then(() => console.log('Database updated successfully'))
  .catch(err => console.error('Error updating database', err))
  .finally(() => client.end());

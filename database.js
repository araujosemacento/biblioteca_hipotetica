import dotenv from 'dotenv';
import mysql from 'mysql2';

dotenv.config();

const $env = process.env;

const pool = mysql.createPool({
  host: 'suzuma.castleman.net',
  user: $env.DB_USER,
  password: $env.DB_PASSWORD,
  database: 'biblioteca_hipotetica'
}).promise();
import mysql from 'mysql2';

export const DBConnection = () => {
  return mysql.createConnection(process.env.DATABASE_URL);
};

export const SQLQueries = {
  CREATE_QUIZZES_TABLE:
    'CREATE TABLE IF NOT EXISTS quizzes (quizID VARCHAR(24), name TEXT, needsAuth VARCHAR(8), data TEXT)',
  CREATE_USERS_TABLE:
    'CREATE TABLE IF NOT EXISTS users (username VARCHAR(16), password TEXT, email TEXT, role VARCHAR(32))',
  CREATE_SESSION_TABLE:
    'CREATE TABLE IF NOT EXISTS sessions (username VARCHAR(16), email TEXT, session TEXT, type TEXT, expire INTEGER)',
  INSERT_QUIZ:
    "INSERT INTO quizzes (quizID, name, needsAuth, data) VALUES ('%quizID%', '%name%', '%needsAuth%', '%data%')",
  CREATE_QUIZ_TABLE: 'CREATE TABLE IF NOT EXISTS %name% (%params%)',
  SELECT_ALL_QUIZZES: "SELECT * FROM quizzes WHERE needsAuth = 'false'",
  SELECT_ALL_QUIZZES_AUTH: 'SELECT * FROM quizzes',
  SELECT_QUIZ: "SELECT * FROM quizzes WHERE quizID='%id%'",
  INSERT_ANSWERS: 'INSERT INTO %id% (%keys%) VALUES (%values%)',
  ADD_USER:
    "INSERT INTO users (username, password, email, role) VALUES ('%user%', '%pass%', '%email%', 'basic')",
  DELETE_QUIZ: 'DROP TABLE %table%',
  DELETE_QUIZ_ENTRY: "DELETE FROM quizzes WHERE quizID='%table%'",
  GET_USER:
    "SELECT * FROM users WHERE username = '%user%' AND password = '%pass%'",
  DECREASE_SESSIONS: 'UPDATE sessions SET expire=expire-60000',
  DELETE_EXPIRED_SESSIONS: 'DELETE FROM sessions WHERE expire < 1',
  CREATE_SESSION:
    "INSERT INTO sessions (username, email, session, type, expire) VALUES ('%user%', '%email%', '%session%', %type%, %expire%)",
  SEARCH_QUIZZES:
    "SELECT * FROM quizzes WHERE needsAuth = 'false' AND name LIKE '%searchParam%'",
  SEARCH_QUIZZES_AUTH: "SELECT * FROM quizzes WHERE name LIKE '%searchParam%'",
  GET_USER_BY_USERNAME: "SELECT * FROM users WHERE username = '%user%'",
  GET_SESSION: "SELECT * FROM sessions WHERE session = '%session%'",
  USERNAME_EXITS: "SELECT 'Taken' FROM users WHERE username = '%user%'",
};

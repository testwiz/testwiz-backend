export const SQLQueries = {
  CREATE_QUIZZES_TABLE:
    'CREATE TABLE IF NOT EXISTS quizzes (quizID VARCHAR(24), data TEXT)',
  INSERT_QUIZ:
    "INSERT INTO quizzes (quizID, data) VALUES ('%quizID%', '%data%')",
  CREATE_QUIZ_TABLE: 'CREATE TABLE IF NOT EXISTS %name% (%params%)',
  SELECT_ALL_QUIZZES: 'SELECT * FROM quizzes',
  SELECT_QUIZ: "SELECT * FROM quizzes WHERE quizID='%id%'",
  INSERT_ANSWERS: 'INSERT INTO %id% (%keys%) VALUES (%values%)',
  DELETE_QUIZ: 'DROP TABLE %table%',
  DELETE_QUIZ_ENTRY: "DELETE FROM quizzes WHERE quizID='%table%'",
};

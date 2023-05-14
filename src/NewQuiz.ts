import { DBConnection } from './db/DBConn';
import { SQLQueries } from './db/SQLQueries';
import { formatString } from './utils/formatString';

export const newTableFromQuiz = (data) => {
  let quizSQLParams: string = '';

  if (data.metadata.needsAuth) {
    quizSQLParams = 'username TEXT, email TEXT, ';
  }

  data.quiz.forEach((q) => {
    if (q.type != 'text') {
      quizSQLParams += `${q.id} TEXT, `;
    }
  });

  quizSQLParams = quizSQLParams.slice(0, -2);

  DBConnection().query(
    formatString(SQLQueries.CREATE_QUIZ_TABLE, [
      {
        key: 'name',
        value: data.metadata.id,
      },
      {
        key: 'params',
        value: quizSQLParams,
      },
    ])
  );
};

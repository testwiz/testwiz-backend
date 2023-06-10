import { SupaBaseClient } from '../SupaBase/SupaBase';

export const newTableFromQuiz = async (data) => {
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

  await SupaBaseClient.rpc('create_quiz', {
    quizname: data.metadata.id,
    quizparams: quizSQLParams,
  });
};

import express from 'express';
import CORS from 'cors';
import passport from 'passport';
import bodyParser from 'body-parser';
import lzs from 'lz-string';
import { DBConnection } from './db/DBConn';
import { BasicStrategy } from 'passport-http';
import { isAuth } from './auth/isAuth';
import { SQLQueries } from './db/SQLQueries';
import { formatString } from './utils/formatString';
import { newTableFromQuiz } from './NewQuiz';

// Variables
const webApp = express();

// Init
require('dotenv').config();
webApp.use(CORS());
webApp.use(bodyParser.json());
passport.use(
  new BasicStrategy((username, password, done) => {
    if (isAuth(username, password)) {
      return done(null, username);
    } else {
      return done(null, false);
    }
  })
);

// DB Init
DBConnection().query(SQLQueries.CREATE_QUIZZES_TABLE, (err) => {
  if (err) {
    console.error(err);
  }
});

// Methods
webApp.get('/', (_, res) => {
  res.status(200).end('Server is active!');
});

webApp.get('/quiz/:quizID', (req, res) => {
  DBConnection().query(
    formatString(SQLQueries.SELECT_QUIZ, [
      { key: 'id', value: req.params.quizID },
    ]),
    (_, val) => {
      res.status(200).json(val);
    }
  );
});

webApp.get('/quizzes', (_, res) => {
  DBConnection().query(SQLQueries.SELECT_ALL_QUIZZES, (_, val) => {
    res.status(200).json(val);
  });
});

webApp.post('/submitQuiz/:quizID', (req, res) => {
  let keys: string = '';
  let values: string = '';

  Object.keys(req.body).forEach((e) => {
    keys += `${e}, `;
    values += `'${req.body[e]}', `;
  });

  keys = keys.slice(0, -2);
  values = values.slice(0, -2);

  DBConnection().query(
    formatString(SQLQueries.INSERT_ANSWERS, [
      {
        key: 'id',
        value: req.params.quizID,
      },
      {
        key: 'keys',
        value: keys,
      },
      {
        key: 'values',
        value: values,
      },
    ])
  );

  res.status(200).end('OK!');
});

webApp.post(
  '/newQuiz',
  passport.authenticate('basic', { session: false }),
  (req, res) => {
    let quizID: string = JSON.parse(
      lzs.decompressFromBase64(String(req.body.data))
    ).metadata.id;
    newTableFromQuiz(
      JSON.parse(lzs.decompressFromBase64(String(req.body.data)))
    );

    DBConnection().query(
      formatString(SQLQueries.INSERT_QUIZ, [
        {
          key: 'quizID',
          value: quizID,
        },
        {
          key: 'data',
          value: req.body.data,
        },
      ])
    );

    res.status(200).end('OK!');
  }
);

webApp.delete(
  '/deleteQuiz/:quizID',
  passport.authenticate('basic', { session: false }),
  (req, res) => {
    DBConnection().query(
      formatString(SQLQueries.DELETE_QUIZ, [
        { key: 'table', value: req.params.quizID },
      ])
    );
    DBConnection().query(
      formatString(SQLQueries.DELETE_QUIZ_ENTRY, [
        { key: 'table', value: req.params.quizID },
      ])
    );

    res.status(200).end('OK!');
  }
);

// Server
webApp.listen(process.env.PORT || 3000, () => {
  console.log(`Express Server running on port, ${process.env.PORT || 3000}`);
});

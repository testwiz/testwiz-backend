import express from 'express';
import CORS from 'cors';
import passport from 'passport';
import bodyParser from 'body-parser';
import lzs from 'lz-string';
import cron from 'node-cron';
import { DBConnection } from './db/DBConn';
import { BasicStrategy } from 'passport-http';
import { SQLQueries } from './db/SQLQueries';
import { formatString } from './utils/formatString';
import { newTableFromQuiz } from './NewQuiz';
import {
  getSessionEmail,
  getSessionUsername,
  isSession,
  refreshSessions,
} from './session/Sessions';
import { SessionType } from './session/SessionType';
import { loginUser, registerUser } from './auth/Users';

// Variables
const webApp = express();

// Init
require('dotenv').config();
webApp.use(CORS());
webApp.use(bodyParser.json());
passport.use(
  new BasicStrategy(async (username, password, done) => {
    if (
      username == process.env.ENCRYPTION_BASIC_USER &&
      password == process.env.ENCRYPTION_BASIC_PASS
    ) {
      return done(null, username);
    } else {
      const user = (await getUserFromDB(username, password)) as [any];
      if (String(user.length) !== '0') {
        done(null, username);
      } else {
        return done(null, false);
      }
    }
  })
);

// DB Init
DBConnection().query(SQLQueries.CREATE_QUIZZES_TABLE, (err) => {
  if (err) {
    console.log(err.code);
  }
});

DBConnection().query(SQLQueries.CREATE_USERS_TABLE, (err) => {
  if (err) {
    console.log(err.code);
  }
});

DBConnection().query(SQLQueries.CREATE_SESSION_TABLE, (err) => {
  if (err) {
    console.log(err.code);
  }
});

// Methods
const getUserFromDB = (username: string, password: string) => {
  return new Promise((resolve) => {
    DBConnection().query(
      formatString(SQLQueries.GET_USER, [
        {
          key: 'user',
          value: username,
        },
        {
          key: 'pass',
          value: password,
        },
      ]),
      (_, vals) => {
        resolve(JSON.parse(JSON.stringify(vals)));
      }
    );
  });
};

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

webApp.get('/quizzes/search/:search', (req, res) => {
  DBConnection().query(
    formatString(SQLQueries.SEARCH_QUIZZES, [
      { key: 'searchParam', value: `%${req.params.search}%` },
    ]),
    (_, val) => {
      res.status(200).json(val);
    }
  );
});

webApp.get(
  '/quizzes/auth',
  passport.authenticate('basic', { session: false }),
  (req, res) => {
    if (
      req.query.session &&
      isSession(String(req.query.session), SessionType.BASIC)
    ) {
      DBConnection().query(SQLQueries.SELECT_ALL_QUIZZES_AUTH, (_, val) => {
        res.status(200).json(val);
      });
    } else {
      res.status(422).end('BAD DATA!');
    }
  }
);

webApp.get(
  '/quizzes/search/:search/auth',
  passport.authenticate('basic', { session: false }),
  (req, res) => {
    if (
      req.query.session &&
      isSession(String(req.query.session), SessionType.BASIC)
    ) {
      DBConnection().query(
        formatString(SQLQueries.SEARCH_QUIZZES_AUTH, [
          { key: 'searchParam', value: `%${req.params.search}%` },
        ]),
        (_, val) => {
          res.status(200).json(val);
        }
      );
    } else {
      res.status(422).end('BAD DATA!');
    }
  }
);

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
  '/submitQuiz/:quizID/auth',
  passport.authenticate('basic', { session: false }),
  async (req, res) => {
    if (
      req.query.session &&
      isSession(String(req.query.session), SessionType.BASIC)
    ) {
      let keys: string = 'username, email, ';
      let values: string = `'${await getSessionUsername(
        ''
      )}', '${await getSessionEmail('')}', `;

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
    } else {
      res.status(403).end('Unauthorised OR BAD DATA');
    }
  }
);

webApp.post(
  '/newQuiz',
  passport.authenticate('basic', { session: false }),
  (req, res) => {
    if (
      req.query.session &&
      isSession(String(req.query.session), SessionType.CREATOR)
    ) {
      let quizID: string = JSON.parse(
        lzs.decompressFromBase64(String(req.body.data))
      ).metadata.id;

      let needsAuth: string = JSON.parse(
        lzs.decompressFromBase64(String(req.body.data))
      ).metadata.needsAuth;

      let name: string = JSON.parse(
        lzs.decompressFromBase64(String(req.body.data))
      ).metadata.name;

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
            key: 'name',
            value: name,
          },
          {
            key: 'needsAuth',
            value: String(needsAuth),
          },
          {
            key: 'data',
            value: req.body.data,
          },
        ])
      );

      res.status(200).end('OK!');
    } else {
      res.status(403).end('Unauthorised');
    }
  }
);

webApp.delete(
  '/deleteQuiz/:quizID',
  passport.authenticate('basic', { session: false }),
  (req, res) => {
    if (
      req.query.session &&
      isSession(String(req.query.session), SessionType.ADMIN)
    ) {
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
    } else {
      res.status(403).end('Unauthorised');
    }
  }
);

webApp.post('/accounts/register', async (req, res) => {
  if (req.body.username && req.body.password && req.body.email) {
    res
      .status(200)
      .end(
        await registerUser(req.body.username, req.body.password, req.body.email)
      );
  } else {
    res.status(422).end('BAD DATA');
  }
});

webApp.post('/accounts/login', async (req, res) => {
  if (req.body.username && req.body.password) {
    res.status(200).end(await loginUser(req.body.username, req.body.password));
  } else {
    res.status(422).end('BAD DATA');
  }
});

webApp.get('/session/exists', (req, res) => {
  if (req.query.session) {
    DBConnection().query(
      formatString(SQLQueries.GET_SESSION, [
        { key: 'session', value: String(req.query.session) },
      ]),
      (_, val) => {
        res.status(200).json(val);
      }
    );
  } else {
    res.status(422).end('BAD DATA');
  }
});

webApp.get('/accounts/exists/:username', (req, res) => {
  DBConnection()
    .promise()
    .query(
      formatString(SQLQueries.USERNAME_EXITS, [
        { key: 'user', value: req.params.username },
      ])
    )
    .then((val) => res.status(200).json(JSON.parse(JSON.stringify(val))[0][0]));
});

// Server
webApp.listen(process.env.PORT || 3000, () => {
  console.log(`Express Server running on port, ${process.env.PORT || 3000}`);
});

// Cron Expire
cron.schedule('0 * * * * *', () => refreshSessions());

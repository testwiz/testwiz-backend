// hiii - sonicx180

import express from 'express';
import CORS from 'cors';
import passport from 'passport';
import bodyParser from 'body-parser';
import lzs from 'lz-string';
import corn from 'node-cron';
import corn_parser from 'cron-parser';

import { BasicStrategy } from 'passport-http';
import {
  SessionType,
  Sessions,
  getUserSession,
  sessionValid,
} from './sessions/Sessions';
import { SupaBaseClient } from './SupaBase/SupaBase';
import { register } from './accounts/register';
import { login } from './accounts/login';
import { newTableFromQuiz } from './quizzes/createQuiz';

// Config
require('dotenv').config();

// Web Server Init
const app = express();
app.use(CORS());
app.use(bodyParser.json());

// Authentication
passport.use(
  new BasicStrategy(async (username, password, done) => {
    if (
      (username == process.env.ADMIN_USER &&
        password == process.env.ADMIN_PASS) ||
      getUserSession(username).get('session') == password
    ) {
      return done(null, username);
    } else {
      return done(null, false);
    }
  })
);

// Cron
const sessionClearCron = corn.schedule(
  process.env.CRON_SESSION_CLEAR,
  () => (Sessions.length = 0)
); // Delete sessions

// Unauthed
app.get('/', (_, res) => res.status(200).end('Server is Live!'));

app.get('/quiz/:id', async (req, res) => {
  const { data } = await SupaBaseClient.from('quizzes')
    .select()
    .eq('quizid', req.params.id)
    .single();

  res.status(200).json(data);
});

app.get('/quizzes', async (_, res) => {
  let { data } = await SupaBaseClient.from('quizzes')
    .select()
    .eq('needs_auth', false);

  res.status(200).json(data);
});

app.get('/quizzes/search/', async (req, res) => {
  if (req.query.search) {
    const { data } = await SupaBaseClient.from('quizzes')
      .select()
      .eq('needs_auth', false)
      .textSearch('name', `'${req.query.search}'`);

    res.status(200).json(data);
  } else {
    res.status(400).end('Search Missing');
  }
});

app.post('/submit/quiz/:id', async (req, res) => {
  await SupaBaseClient.from(req.params.id).insert(req.body);
  res.status(200).end('Submited!');
});

app.get('/sessions/expires', (_, res) =>
  res.status(200).json({
    expires: corn_parser
      .parseExpression(process.env.CRON_SESSION_CLEAR)
      .next()
      .toDate()
      .toUTCString(),
  })
);

app.get('/accounts/exists/username', async (req, res) => {
  if (req.query.username) {
    const { data } = await SupaBaseClient.from('users')
      .select()
      .eq('username', req.query.username)
      .single();

    res.status(200).json({ exists: data == null ? false : true });
  } else {
    res.status(400).end('Username not entered');
  }
});

app.get('/quizzes/exists/quiz', async (req, res) => {
  if (req.query.quizid) {
    const { data } = await SupaBaseClient.from('quizzes')
      .select()
      .eq('quizid', req.query.quizid)
      .single();

    res.status(200).json({ exists: data == null ? false : true });
  } else {
    res.status(400).end('QuizID not entered');
  }
});

app.post('/accounts/register', async (req, res) => {
  if ((req.body.username, req.body.password, req.body.email)) {
    res
      .status(200)
      .end(
        await register(req.body.username, req.body.password, req.body.email)
      );
  } else {
    res.status(400).end('Bad Data!');
  }
});

app.post('/accounts/login', (req, res) => {
  if (req.body.username && req.body.password) {
    login(req.body.username, req.body.password, res);
  } else {
    res.status(400).end('Bad Data!');
  }
});

app.post('/lz-string/encode', (req, res) => {
  res.status(200).json({
    data: lzs.compressToBase64(JSON.stringify(req.body)),
  });
});

app.post('/lz-string/decode', (req, res) => {
  res.status(200).end(lzs.decompressFromBase64(req.body.data));
});

// Authed
app.get(
  '/auth/quizzes',
  passport.authenticate('basic', { session: false }),
  async (req, res) => {
    if (req.query.username) {
      if (sessionValid(String(req.query.username), SessionType.BASIC)) {
        const { data } = await SupaBaseClient.from('quizzes').select();
        res.status(200).json(data);
      } else {
        res.status(401).end('Unauthorized');
      }
    } else {
      res.status(400).end('Username missing!');
    }
  }
);

app.get(
  '/auth/quizzes/search/:param',
  passport.authenticate('basic', { session: false }),
  async (req, res) => {
    if (req.query.username && req.query.search) {
      if (sessionValid(String(req.query.username), SessionType.BASIC)) {
        const { data } = await SupaBaseClient.from('quizzes')
          .select()
          .textSearch('name', `'${req.query.search}'`);

        res.status(200).json(data);
      } else {
        res.status(401).end('Unauthorized');
      }
    } else {
      res.status(400).end('Search or Username Missing');
    }
  }
);

app.post(
  '/auth/submit/quiz/:id',
  passport.authenticate('basic', { session: false }),
  async (req, res) => {
    if (req.query.username) {
      if (sessionValid(String(req.query.username), SessionType.BASIC)) {
        const data = req.body;
        const userSession = getUserSession(String(req.query.username));

        data.username = req.query.username;
        data.email = userSession.get('email');

        await SupaBaseClient.from(req.params.id).insert(data);
        res.status(200).end('Submitted');
      } else {
        res.status(401).end('Unauthorised');
      }
    } else {
      res.status(400).end('Username Missing');
    }
  }
);

app.post(
  '/auth/new/quiz',
  passport.authenticate('basic', { session: false }),
  async (req, res) => {
    if (req.body.username) {
      if (sessionValid(req.body.username, SessionType.CREATOR)) {
        const quiz = JSON.parse(
          lzs.decompressFromBase64(String(req.body.data))
        );

        const quizID = quiz.metadata.id;
        const needs_auth = quiz.metadata.needsAuth;
        const name = quiz.metadata.name;

        newTableFromQuiz(quiz);
        await SupaBaseClient.from('quizzes').insert({
          quizid: quizID,
          name: name,
          needs_auth: needs_auth,
          data: req.body.data,
        });

        res.status(200).end('Created!');
      } else {
        res.status(401).end('Unauthorized');
      }
    } else {
      res.status(400).end('Username not entered');
    }
  }
);

app.delete(
  '/auth/delete/quiz',
  passport.authenticate('basic', { session: false }),
  async (req, res) => {
    if (req.body.username && req.body.password && req.body.quizid) {
      if (
        req.body.username == process.env.ADMIN_USER &&
        req.body.password == process.env.ADMIN_PASS
      ) {
        await SupaBaseClient.from('quizzes')
          .delete()
          .eq('quizid', req.body.quizid);
        await SupaBaseClient.rpc('delete_quiz', { quizname: req.body.quizid });
        res.status(200).end('Deleted');
      } else {
        res.status(401).end('Unauthorized');
      }
    } else {
      res.status(400).end('Credentials / Quiz ID not entered');
    }
  }
);

// Server
app.listen(process.env.PORT || 3000, () => {
  console.log(`Express Server running on port, ${process.env.PORT || 3000}`);
});

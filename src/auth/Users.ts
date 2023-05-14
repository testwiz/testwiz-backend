import bcrypt from 'bcrypt';
import { DBConnection } from '../db/DBConn';
import { SQLQueries } from '../db/SQLQueries';
import { formatString } from '../utils/formatString';
import { createSession } from '../session/Sessions';
import { SessionType } from '../session/SessionType';

export const registerUser = async (
  username: string,
  password: string,
  email: string
) => {
  let hashedPassword: string;

  await bcrypt
    .hash(
      password,
      bcrypt.genSaltSync(Number(process.env.HASH_SALT_ROUNDS) || 10)
    )
    .then((hash) => (hashedPassword = hash));

  DBConnection().query(
    formatString(SQLQueries.ADD_USER, [
      {
        key: 'user',
        value: username,
      },
      {
        key: 'pass',
        value: hashedPassword,
      },
      {
        key: 'email',
        value: email,
      },
    ])
  );

  return createSession(username, email, SessionType.BASIC);
};

const getUser = (username) => {
  return new Promise((resolve) => {
    DBConnection().query(
      formatString(SQLQueries.GET_USER_BY_USERNAME, [
        { key: 'user', value: username },
      ]),
      (_, val) => {
        resolve(JSON.parse(JSON.stringify(val))[0]);
      }
    );
  });
};

export const loginUser = async (
  username: string,
  password: string
): Promise<string> => {
  let user = (await getUser(username)) as {
    username: string;
    password: string;
    email: string;
    role: string;
  };

  return bcrypt.compare(password, user.password).then((val) => {
    if (val) {
      if (user.role == SessionType.CREATOR) {
        return createSession(username, user.email, SessionType.CREATOR);
      } else {
        return createSession(username, user.email, SessionType.BASIC);
      }
    } else {
      return 'Bad Login Request';
    }
  });
};

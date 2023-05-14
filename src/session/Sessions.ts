import { DBConnection } from '../db/DBConn';
import { SQLQueries } from '../db/SQLQueries';
import { formatString } from '../utils/formatString';
import { SessionType } from './SessionType';
import { v4 as uuidv4 } from 'uuid';

export const isSession = async (currentSession: string, needs: string) => {
  let session = '';

  await DBConnection()
    .promise()
    .query(
      formatString(SQLQueries.GET_SESSION, [
        { key: 'session', value: currentSession },
      ])
    )
    .then((val) => (session = JSON.parse(JSON.stringify(val))[0]));

  if (session == needs) {
    return true;
  }

  if (needs == SessionType.BASIC && session == SessionType.CREATOR) {
    return true;
  }

  if (session == SessionType.ADMIN) {
    return true;
  }

  return false;
};

export const getSessionUsername = async (session: string) => {
  return await DBConnection()
    .promise()
    .query(
      formatString(SQLQueries.GET_SESSION, [{ key: 'session', value: session }])
    )
    .then((val) => {
      return JSON.parse(JSON.stringify(val))[0].username;
    });
};

export const getSessionEmail = async (session: string) => {
  return await DBConnection()
    .promise()
    .query(
      formatString(SQLQueries.GET_SESSION, [{ key: 'session', value: session }])
    )
    .then((val) => {
      return JSON.parse(JSON.stringify(val))[0].email;
    });
};

export const refreshSessions = () => {
  DBConnection().query(SQLQueries.DECREASE_SESSIONS);
  DBConnection().query(SQLQueries.DELETE_EXPIRED_SESSIONS);
};

export const createSession = (
  username: string,
  email: string,
  type: string
): string => {
  const session = uuidv4();
  DBConnection().query(
    formatString(SQLQueries.CREATE_SESSION, [
      { key: 'user', value: username },
      { key: 'email', value: email },
      { key: 'session', value: session },
      { key: 'type', value: type },
      { key: 'expire', value: process.env.SESSION_EXPIRE_MAX || '480000' },
    ])
  );

  return session;
};

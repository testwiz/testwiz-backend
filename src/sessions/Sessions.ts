import { v4 as uuidv4 } from 'uuid';

export let Sessions = new Array<Map<string, string>>();

export const SessionType = {
  BASIC: 'basic',
  CREATOR: 'creator',
  FORGOT_PASS: 'forgot_pass',
  ADMIN: 'admin',
};

export const getUserSession = (user: string): Map<string, string> | null => {
  return (Sessions.find((v) => v.get('username') == user)) ? Sessions.find((v) => v.get('username') == user) : new Map();
};

export const createSession = (
  user: string,
  email: string,
  type: string
): string => {
  destroySession(user);

  const newUser = new Map();
  newUser.set('username', user);
  newUser.set('email', email);
  newUser.set('type', type);
  newUser.set('session', uuidv4());

  Sessions.push(newUser);
  return newUser.get('session');
};

export const destroySession = (user: string): void => {
  Sessions = Sessions.filter((v) => v != getUserSession(user));
};

export const sessionValid = (user: string, needs: string): boolean => {
  const current = getUserSession(user).get('type');

  if (current == needs) return true;
  if (current == SessionType.ADMIN) return true;
  if (current == SessionType.CREATOR && needs == SessionType.BASIC) return true;

  return false;
};

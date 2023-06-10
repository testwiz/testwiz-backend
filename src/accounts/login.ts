import { SupaBaseClient } from '../SupaBase/SupaBase';
import { Response } from 'express';
import bcrypt from 'bcrypt';
import { SessionType, createSession } from '../sessions/Sessions';

export const login = async (user: string, pass: string, res: Response) => {
  const { data: userData } = await SupaBaseClient.from('users')
    .select()
    .eq('username', user)
    .single();

  if (userData == null) {
    res.status(404).end('404 - User not exists');
    return;
  }

  bcrypt.compare(pass, userData.password).then((success) => {
    if (success) {
      res
        .status(200)
        .end(
          userData.role != SessionType.CREATOR
            ? createSession(user, userData.email, SessionType.BASIC)
            : createSession(user, userData.email, SessionType.CREATOR)
        );
    } else {
      res.status(403).end('Invalid Credentials');
    }
  });
};

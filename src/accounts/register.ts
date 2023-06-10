import bcrypt from 'bcrypt';
import { SupaBaseClient } from '../SupaBase/SupaBase';
import { SessionType, createSession } from '../sessions/Sessions';

export const register = async (user: string, pass: string, email: string) => {
  const hash = await bcrypt.hash(
    pass,
    bcrypt.genSaltSync(Number(process.env.HASH_SALT_ROUNDS) || 10)
  );

  await SupaBaseClient.from('users').insert({
    username: user,
    password: hash,
    email: email,
    role: SessionType.BASIC,
  });

  return createSession(user, email, SessionType.BASIC);
};

export const isAuth = (username: string, password: string) => {
  if (
    username == process.env.ENCRYPTION_BASIC_USER &&
    password == process.env.ENCRYPTION_BASIC_PASS
  ) {
    return true;
  }
  return false;
};

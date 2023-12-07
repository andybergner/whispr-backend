import bcrypt from "bcrypt";
const saltRounds = 10;

export async function hashPassword(password: string) {
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
}

export async function checkPassword(inputPassword: string, hashedPassword: string) {
  const passwordMatch = await bcrypt.compare(inputPassword, hashedPassword);
  return passwordMatch;
}

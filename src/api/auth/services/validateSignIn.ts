const validateSignIn = ({
  username,
  password,
}: {
  username: string;
  password: string;
}): { error?: string[] } => {
  console.log("sign in", { username, password });
  return {} as { error: string[] };
};
export default validateSignIn;

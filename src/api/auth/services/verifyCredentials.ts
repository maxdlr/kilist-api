import findUser from "@/api/users/services/findUser";
import bcrypt from "bcrypt";
import validateSignIn from "./validateSignIn";

const verifyCredentials = async (data: { username: string; password: string }) => {
  data.username = data.username.trim().toLowerCase();
  const { error } = validateSignIn(data);
  if (error) throw error;

  const { username, password } = data;

  const user = await findUser({ username }, true);

  // const user = await UserRepository.createQueryBuilder("user")
  //   .addSelect("user._password")
  //   .where("user.username = :username", { username })
  //   .getOne();

  if (!user) throw ApiError("Email ou mot de passe incorrect");

  const pwdMatch = bcrypt.compareSync(password, user.password);
  if (!pwdMatch) throw ApiError("Email ou mot de passe incorrect");

  return user;
};

export default verifyCredentials;

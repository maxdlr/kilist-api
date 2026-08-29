import RefreshTokenRepository from "@/repositories/RefreshTokenRepository";

const createRefreshToken = async (token: string, userId: number) => {
  const expireOn = new Date(new Date().setDate(new Date().getDate() + 15)); // 15d from now

  await RefreshTokenRepository.save({
    token,
    expireOn,
    userId: Number(userId),
  });

  return token;
};

export default createRefreshToken;

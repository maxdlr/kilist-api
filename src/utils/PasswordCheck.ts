import { IsStrongPassword } from "class-validator";

class PasswordCheck {
  @IsStrongPassword(
    { minLength: 8, minSymbols: 1, minNumbers: 1 },
    { message: "validation.password.weak" },
  )
  password!: string;
}

export default PasswordCheck;

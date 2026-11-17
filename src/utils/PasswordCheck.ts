import { RULES } from "@/api/catalog/rules";
import { IsStrongPassword } from "class-validator";

class PasswordCheck {
  @IsStrongPassword(RULES.accounts.password, { message: "validation.password.weak" })
  password!: string;
}

export default PasswordCheck;

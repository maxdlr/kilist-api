import bcrypt from "bcrypt";
import { IsEmail, IsNotEmpty, MinLength } from "class-validator";
import { Column, Entity, ManyToOne } from "typeorm";
import { AbstractEntity } from "./AbstractEntity";
import HouseholdEntity from "./HouseholdEntity";

export const DEFAULT_SKIN = "arcade";
export const SKIN_PATTERN = /^[a-z][a-z0-9-]{0,31}$/;

@Entity({ name: "users" })
export default class UserEntity extends AbstractEntity {
  @Column({ name: "password", select: false })
  private _password!: string;

  @Column({ unique: true })
  @MinLength(3, { message: "Too short! Minimum is 3 characters" })
  @IsNotEmpty({ message: "Required" })
  username!: string;

  @Column({ unique: true })
  @IsEmail({}, { message: "Doesn't look like an email" })
  email!: string;

  @Column({ default: "", length: 2000 })
  description?: string;

  @ManyToOne(() => HouseholdEntity, (household) => household.members, {
    nullable: false,
    onDelete: "RESTRICT",
  })
  household!: HouseholdEntity;

  @Column({ nullable: false, default: "user" })
  type!: "user" | "admin";

  @Column({ nullable: false, default: DEFAULT_SKIN, length: 32 })
  skin!: string;

  set password(value: string) {
    this._password = bcrypt.hashSync(value, 10);
  }

  get password() {
    return this._password;
  }
}

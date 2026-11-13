import bcrypt from "bcrypt";
import { IsEmail, IsNotEmpty, MinLength } from "class-validator";
import { Column, Entity, ManyToOne } from "typeorm";
import { AbstractEntity } from "./AbstractEntity";
import HouseholdEntity from "./HouseholdEntity";

export const DEFAULT_SKIN = "calm";
export const SKIN_PATTERN = /^[a-z][a-z0-9-]{0,31}$/;

@Entity({ name: "users" })
export default class UserEntity extends AbstractEntity {
  @Column({ name: "password", select: false })
  private _password!: string;

  @Column({ unique: true })
  @MinLength(3, { message: "validation.username.short" })
  @IsNotEmpty({ message: "validation.username.required" })
  username!: string;

  @Column({ unique: true })
  @IsEmail({}, { message: "validation.email.invalid" })
  email!: string;

  @Column({ type: "varchar", unique: true, nullable: true, default: null, length: 64 })
  googleId?: string | null;

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

  @Column({ type: "varchar", nullable: true, default: null, length: 8 })
  language!: string | null;

  @Column({ type: "varchar", nullable: true, default: null, length: 8 })
  deviceLanguage!: string | null;

  @Column({ type: "datetime", nullable: true, default: null })
  emailConfirmedAt?: Date | null;

  @Column({ type: "simple-json", nullable: true })
  notifications?: Record<string, string> | null;

  set password(value: string) {
    this._password = bcrypt.hashSync(value, 10);
  }

  get password() {
    return this._password;
  }
}

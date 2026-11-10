import { Column, Entity, Index, ManyToOne } from "typeorm";
import { AbstractEntity } from "./AbstractEntity";
import UserEntity from "./UserEntity";

export type VerificationPurpose = "reset" | "confirm";

@Entity({ name: "verification_codes" })
@Index(["user", "purpose"])
export default class VerificationCodeEntity extends AbstractEntity {
  @ManyToOne(() => UserEntity, { nullable: false, onDelete: "CASCADE" })
  user!: UserEntity;

  @Column({ type: "varchar", length: 16 })
  purpose!: VerificationPurpose;

  @Column({ type: "varchar", length: 128 })
  codeHash!: string;

  @Column({ type: "datetime" })
  expiresAt!: Date;

  @Column({ type: "int", default: 0 })
  attempts!: number;

  @Column({ type: "datetime", nullable: true })
  usedAt?: Date | null;
}

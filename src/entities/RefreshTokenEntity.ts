import { Column, Entity } from "typeorm";
import { AbstractEntity } from "./AbstractEntity";

@Entity({ name: "refreshToken" })
export default class RefreshTokenEntity extends AbstractEntity {
  @Column({ nullable: false })
  token!: string;

  @Column({ nullable: false })
  expireOn!: Date;

  @Column({ nullable: true })
  revokedOn?: Date;

  @Column({ nullable: true })
  revokedReason?: "token-replaced" | "user-logout" | "password-change";

  @Column({ nullable: true })
  rotatedFrom?: number;

  @Column({ nullable: true })
  rotatedTo?: number;

  @Column({ nullable: false })
  userId!: number;

  @Column({ nullable: true })
  isExpired?: boolean;
}

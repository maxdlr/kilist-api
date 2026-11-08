import { Column, Entity, Index, ManyToOne } from "typeorm";
import { AbstractEntity } from "./AbstractEntity";
import UserEntity from "./UserEntity";

export type EmailLogStatus = "sent" | "failed" | "not_configured";

@Entity({ name: "email_logs" })
export default class EmailLogEntity extends AbstractEntity {
  @ManyToOne(() => UserEntity, { nullable: true, onDelete: "SET NULL" })
  user?: UserEntity | null;

  @Column({ type: "varchar", length: 255 })
  @Index()
  recipient!: string;

  @Column({ type: "varchar", length: 32 })
  @Index()
  emailId!: string;

  @Column({ type: "varchar", length: 8 })
  lang!: string;

  @Column({ type: "varchar", length: 16 })
  @Index()
  status!: EmailLogStatus;

  @Column({ type: "varchar", length: 500, nullable: true })
  error?: string | null;
}

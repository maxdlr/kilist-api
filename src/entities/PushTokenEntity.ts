import { Column, Entity, Index, ManyToOne } from "typeorm";
import { AbstractEntity } from "./AbstractEntity";
import UserEntity from "./UserEntity";

@Entity({ name: "push_tokens" })
export default class PushTokenEntity extends AbstractEntity {
  @ManyToOne(() => UserEntity, { nullable: true, onDelete: "CASCADE" })
  user?: UserEntity | null;

  @Index()
  @Column({ type: "varchar", length: 64, nullable: true })
  installId?: string | null;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 255 })
  token!: string;

  @Column({ type: "varchar", length: 16, default: "android" })
  platform!: string;

  @Column({ type: "varchar", length: 5, default: "" })
  lang!: string;

  @Column({ type: "boolean", default: true })
  news!: boolean;

  @Column({ type: "datetime" })
  lastSeenAt!: Date;
}

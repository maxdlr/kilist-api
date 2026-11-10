import { Column, Entity, Index, ManyToOne } from "typeorm";
import { AbstractEntity } from "./AbstractEntity";
import UserEntity from "./UserEntity";

@Entity({ name: "push_tokens" })
export default class PushTokenEntity extends AbstractEntity {
  @ManyToOne(() => UserEntity, { nullable: false, onDelete: "CASCADE" })
  user!: UserEntity;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 255 })
  token!: string;

  @Column({ type: "varchar", length: 16, default: "android" })
  platform!: string;

  @Column({ type: "datetime" })
  lastSeenAt!: Date;
}

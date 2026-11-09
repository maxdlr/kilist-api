import { Column, Entity, Index, ManyToOne } from "typeorm";
import { AbstractEntity } from "./AbstractEntity";
import UserEntity from "./UserEntity";

export type SyncOpStatus = "applied" | "rejected";

@Entity({ name: "sync_ops" })
@Index(["user", "opId"], { unique: true })
export default class SyncOpEntity extends AbstractEntity {
  @ManyToOne(() => UserEntity, { nullable: false, onDelete: "CASCADE" })
  user!: UserEntity;

  @Column({ type: "varchar", length: 64 })
  opId!: string;

  @Column({ type: "varchar", length: 32 })
  type!: string;

  @Column({ type: "varchar", length: 16 })
  status!: SyncOpStatus;

  @Column({ type: "simple-json", nullable: true })
  ids?: Record<string, number> | null;
}

import { Column, Entity, Index, ManyToOne } from "typeorm";
import { AbstractEntity } from "./AbstractEntity";
import UserEntity from "./UserEntity";

export type AdminTarget = "user" | "household" | "food" | "list";

@Entity({ name: "admin_actions" })
@Index(["targetType", "targetId"])
export default class AdminActionEntity extends AbstractEntity {
  @ManyToOne(() => UserEntity, { nullable: true, onDelete: "SET NULL" })
  admin?: UserEntity | null;

  @Column({ type: "varchar", length: 16 })
  targetType!: AdminTarget;

  @Column({ type: "int" })
  targetId!: number;

  @Column({ type: "varchar", length: 500 })
  summary!: string;
}

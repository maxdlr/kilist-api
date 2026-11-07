import { Column, Entity, ManyToOne, Unique } from "typeorm";
import { AbstractEntity } from "./AbstractEntity";
import UserEntity from "./UserEntity";

export type UnlockSource = "points" | "gift" | "purchase";

@Entity({ name: "unlocks" })
@Unique(["user", "prizeId"])
export default class UnlockEntity extends AbstractEntity {
  @ManyToOne(() => UserEntity, { nullable: false, onDelete: "CASCADE" })
  user!: UserEntity;

  @Column({ type: "varchar", length: 64 })
  prizeId!: string;

  @Column({ type: "varchar", length: 16, default: "points" })
  source!: UnlockSource;
}

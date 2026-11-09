import { Column, Entity, Index, ManyToOne } from "typeorm";
import { AbstractEntity } from "./AbstractEntity";
import UserEntity from "./UserEntity";

export enum TicketReason {
  SWIPE = "swipe",
  SPEED = "speed",
  REDEEM = "redeem",
  ADMIN = "admin",
  IMPORT = "import",
}

@Entity({ name: "ticket_entries" })
@Index(["user", "createdAt"])
export default class TicketEntryEntity extends AbstractEntity {
  @ManyToOne(() => UserEntity, { nullable: false, onDelete: "CASCADE" })
  user!: UserEntity;

  @Column({ type: "int" })
  amount!: number;

  @Column({ type: "enum", enum: TicketReason })
  reason!: TicketReason;

  @Column({ type: "int", nullable: true })
  foodId?: number | null;

  @Column({ type: "varchar", length: 64, nullable: true })
  prizeId?: string | null;
}

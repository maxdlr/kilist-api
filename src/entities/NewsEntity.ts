import { Column, Entity, Index, ManyToOne } from "typeorm";
import { AbstractEntity } from "./AbstractEntity";
import UserEntity from "./UserEntity";

export type NewsStatus = "draft" | "scheduled" | "sending" | "sent" | "failed" | "cancelled";

@Entity({ name: "news" })
export default class NewsEntity extends AbstractEntity {
  @Column({ type: "varchar", length: 120, default: "" })
  titleEn!: string;

  @Column({ type: "varchar", length: 500, default: "" })
  bodyEn!: string;

  @Column({ type: "varchar", length: 120, default: "" })
  titleFr!: string;

  @Column({ type: "varchar", length: 500, default: "" })
  bodyFr!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  url?: string | null;

  @Index()
  @Column({ type: "datetime" })
  sendAt!: Date;

  @Index()
  @Column({ type: "varchar", length: 16, default: "scheduled" })
  status!: NewsStatus;

  @Column({ type: "datetime", nullable: true })
  sentAt?: Date | null;

  @Column({ type: "int", default: 0 })
  delivered!: number;

  @Column({ type: "int", default: 0 })
  failed!: number;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: "SET NULL" })
  author?: UserEntity | null;
}

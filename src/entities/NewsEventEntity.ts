import { Column, Entity, Index, ManyToOne } from "typeorm";
import { AbstractEntity } from "./AbstractEntity";
import NewsEntity from "./NewsEntity";

export const NEWS_EVENT_KINDS = ["push_open", "card_open", "card_close"] as const;
export type NewsEventKind = (typeof NEWS_EVENT_KINDS)[number];

@Entity({ name: "news_events" })
@Index(["news", "installId", "kind"], { unique: true })
export default class NewsEventEntity extends AbstractEntity {
  @ManyToOne(() => NewsEntity, { nullable: false, onDelete: "CASCADE" })
  news!: NewsEntity;

  @Column({ type: "varchar", length: 64 })
  installId!: string;

  @Column({ type: "varchar", length: 16 })
  kind!: NewsEventKind;
}

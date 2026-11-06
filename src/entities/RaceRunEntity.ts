import { Column, Entity, Index, ManyToOne } from "typeorm";
import { AbstractEntity } from "./AbstractEntity";
import RaceEntity from "./RaceEntity";
import UserEntity from "./UserEntity";

export type RaceAnswer = "in" | "out" | "up";

export type RaceRunAnswer = { foodId: number; answer: RaceAnswer; ms: number };

@Entity({ name: "race_runs" })
@Index(["race", "user"], { unique: true })
export default class RaceRunEntity extends AbstractEntity {
  @ManyToOne(() => RaceEntity, (race) => race.runs, {
    nullable: false,
    onDelete: "CASCADE",
  })
  race!: RaceEntity;

  @ManyToOne(() => UserEntity, { nullable: false, onDelete: "CASCADE" })
  user!: UserEntity;

  @Column({ type: "simple-json" })
  answers!: RaceRunAnswer[];

  @Column({ type: "int", nullable: true })
  totalMs?: number | null;

  @Column({ type: "datetime", nullable: true })
  finishedAt?: Date | null;
}

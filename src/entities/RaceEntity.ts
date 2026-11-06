import { Column, Entity, Index, ManyToOne, OneToMany } from "typeorm";
import { AbstractEntity } from "./AbstractEntity";
import HouseholdEntity from "./HouseholdEntity";
import RaceRunEntity from "./RaceRunEntity";

@Entity({ name: "races" })
@Index(["household", "day"], { unique: true })
export default class RaceEntity extends AbstractEntity {
  @ManyToOne(() => HouseholdEntity, { nullable: false, onDelete: "CASCADE" })
  household!: HouseholdEntity;

  @Column({ type: "varchar", length: 10 })
  day!: string;

  @Column({ type: "simple-json" })
  foodIds!: number[];

  @OneToMany(() => RaceRunEntity, (run) => run.race)
  runs!: RaceRunEntity[];
}

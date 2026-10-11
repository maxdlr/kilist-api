import {
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  UpdateDateColumn,
} from "typeorm";
import { AbstractEntity } from "./AbstractEntity";
import FoodEntity from "./FoodEntity";

@Entity({ name: "session" })
export default class SessionEntity extends AbstractEntity {
  @ManyToMany(() => FoodEntity, {
    nullable: true,
  })
  @JoinTable()
  foods!: FoodEntity[];

  @CreateDateColumn()
  startedAt?: Date;

  @UpdateDateColumn()
  endedAt?: Date;
}

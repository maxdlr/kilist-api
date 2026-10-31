import { Column, Entity, JoinTable, ManyToMany } from "typeorm";
import { AbstractEntity } from "./AbstractEntity";
import FoodEntity from "./FoodEntity";

export enum SwipeListStatus {
  STARTED = "started",
  IN_PROGRESS = "in-progress",
  COMPLETED = "completed",
}

@Entity({ name: "swipe-list" })
export default class SwipeListEntity extends AbstractEntity {
  @ManyToMany(() => FoodEntity)
  @JoinTable()
  inStockFoods!: FoodEntity[] | number[];

  @ManyToMany(() => FoodEntity)
  @JoinTable()
  outOfStockFoods!: FoodEntity[] | number[];

  @ManyToMany(() => FoodEntity)
  @JoinTable()
  startFoods!: FoodEntity[] | number[];

  @Column({ nullable: true })
  endedAt?: Date;

  @Column({
    nullable: false,
    type: "enum",
    enum: SwipeListStatus,
  })
  status?: SwipeListStatus;
}

import { Column, Entity, JoinTable, ManyToMany, ManyToOne } from "typeorm";
import { AbstractEntity } from "./AbstractEntity";
import FoodEntity from "./FoodEntity";
import HouseholdEntity from "./HouseholdEntity";
import UserEntity from "./UserEntity";

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

  @ManyToOne(() => HouseholdEntity, {
    nullable: false,
    onDelete: "CASCADE",
  })
  household!: HouseholdEntity;

  /**
   * Who played this round: every member gets their own daily game. Null on rounds played before
   * games were per member; those count for everyone in the household (see playedRounds).
   */
  @ManyToOne(() => UserEntity, { nullable: true, onDelete: "CASCADE" })
  user?: UserEntity | null;
}

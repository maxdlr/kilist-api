import { Column, Entity, JoinTable, ManyToMany } from "typeorm";
import { AbstractEntity } from "./AbstractEntity";
import FoodEntity from "./FoodEntity";

export enum ShopListStatus {
  STARTED = "started",
  IN_PROGRESS = "in-progress",
  COMPLETED = "completed",
}

@Entity({ name: "shop-list" })
export default class ShopListEntity extends AbstractEntity {
  @ManyToMany(() => FoodEntity, {
    nullable: true,
  })
  @JoinTable()
  boughtFoods!: FoodEntity[] | number[];

  @ManyToMany(() => FoodEntity, {
    nullable: true,
  })
  @JoinTable()
  startFoods!: FoodEntity[] | number[];

  @Column({ nullable: true })
  endedAt?: Date;

  @Column({
    nullable: false,
    type: "enum",
    enum: ShopListStatus,
  })
  status?: ShopListStatus;
}

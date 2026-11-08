import { Column, Entity, JoinTable, ManyToMany, ManyToOne } from "typeorm";
import { AbstractEntity } from "./AbstractEntity";
import FoodEntity from "./FoodEntity";
import HouseholdEntity from "./HouseholdEntity";
import UserEntity from "./UserEntity";

export type ShopBuy = { foodId: number; at: string };
export type ShopSuggestion = { foodId: number; taken: boolean };

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

  @Column({ type: "datetime", nullable: true })
  startedAt?: Date | null;

  @Column({ nullable: true })
  endedAt?: Date;

  @Column({
    nullable: false,
    type: "enum",
    enum: ShopListStatus,
  })
  status?: ShopListStatus;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: "SET NULL" })
  user?: UserEntity | null;

  @Column({ type: "simple-json", nullable: true })
  buyLog?: ShopBuy[] | null;

  @Column({ type: "simple-json", nullable: true })
  suggestionLog?: ShopSuggestion[] | null;

  @ManyToOne(() => HouseholdEntity, {
    nullable: false,
    onDelete: "CASCADE",
  })
  household!: HouseholdEntity;
}

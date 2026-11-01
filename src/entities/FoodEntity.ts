import { IsUrl } from "class-validator";
import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany } from "typeorm";
import { AbstractEntity } from "./AbstractEntity";
import FoodCategoryEntity from "./FoodCategory";
import FoodHistoryEntity from "./FoodHistoryEntity";
import HouseholdEntity from "./HouseholdEntity";
import ListEntity from "./ListEntity";

@Entity({ name: "foods" })
export default class FoodEntity extends AbstractEntity {
  @Column()
  name!: string;

  @Column({ nullable: true })
  @IsUrl({}, { message: "Invalid URL" })
  imageUrl!: string;

  @ManyToMany(() => ListEntity, (list) => list.foods, { nullable: true })
  lists!: ListEntity[];

  @Column({ type: "float", default: 1 })
  inStockScore!: number;

  @OneToMany(() => FoodHistoryEntity, (foodHistory) => foodHistory.food)
  foodHistories!: FoodHistoryEntity[];

  @ManyToMany(() => FoodCategoryEntity, {
    nullable: true,
  })
  @JoinTable()
  categories!: FoodCategoryEntity[];

  @Column({ default: "", length: 2000 })
  description?: string;

  @Column({ nullable: true })
  snoozedUntil!: Date;

  @ManyToOne(() => HouseholdEntity, {
    nullable: false,
    onDelete: "CASCADE",
  })
  household!: HouseholdEntity;
}

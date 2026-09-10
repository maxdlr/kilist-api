import { Column, Entity, JoinTable, ManyToMany, OneToMany } from "typeorm";
import { AbstractEntity } from "./AbstractEntity";
import ListEntity from "./ListEntity";
import { IsUrl } from "class-validator";
import FoodCategoryEntity from "./FoodCategory";
import FoodHistoryEntity from "./FoodHistoryEntity";

@Entity({ name: "foods" })
export default class FoodEntity extends AbstractEntity {
  @Column()
  name!: string;

  @Column({ nullable: true })
  @IsUrl({}, { message: "Invalid URL" })
  imageUrl!: string;

  @ManyToMany(() => ListEntity, {
    nullable: true,
  })
  @JoinTable()
  lists!: ListEntity[];

  @Column({ type: "float", default: 1 })
  inStockScore!: number;

  @OneToMany(() => FoodHistoryEntity, (inStockScore) => inStockScore.food)
  inStockScores?: FoodHistoryEntity[];

  @ManyToMany(() => FoodCategoryEntity, {
    nullable: true,
  })
  @JoinTable()
  categories!: FoodCategoryEntity[];

  @Column({ default: "", length: 2000 })
  description?: string;
}

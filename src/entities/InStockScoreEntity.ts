import { Column, Entity, ManyToOne } from "typeorm";
import { AbstractEntity } from "./AbstractEntity";
import FoodEntity from "./FoodEntity";

@Entity({ name: "in_stock_scores" })
export default class InStockScoreEntity extends AbstractEntity {
  @ManyToOne(() => FoodEntity, (food) => food.inStockScores, {
    onDelete: "CASCADE",
  })
  food!: FoodEntity;

  @Column({ type: "boolean", default: true })
  isInStock!: boolean;
}

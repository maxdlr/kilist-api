import { Column, Entity, ManyToOne } from "typeorm";
import { AbstractEntity } from "./AbstractEntity";
import FoodEntity from "./FoodEntity";
import UserEntity from "./UserEntity";

@Entity({ name: "food_histories" })
export default class FoodHistoryEntity extends AbstractEntity {
  @ManyToOne(() => FoodEntity, (food) => food.foodHistories, {
    onDelete: "CASCADE",
  })
  food!: FoodEntity;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: "SET NULL" })
  user?: UserEntity | null;

  @Column({ type: "boolean", default: true, nullable: true })
  isInStock!: boolean | null;
}

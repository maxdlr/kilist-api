import { Entity, ManyToOne } from "typeorm";
import { AbstractEntity } from "./AbstractEntity";
import FoodEntity from "./FoodEntity";

@Entity({ name: "frequencies" })
export default class FrequencyEntity extends AbstractEntity {
  @ManyToOne(() => FoodEntity, { nullable: true, onDelete: "CASCADE" })
  food!: FoodEntity | number;

  @ManyToOne(() => FoodEntity, { nullable: true, onDelete: "CASCADE" })
  nextBoughtFood!: FoodEntity | number;
}

import { Entity, ManyToOne } from "typeorm";
import { AbstractEntity } from "./AbstractEntity";
import FoodEntity from "./FoodEntity";

@Entity({ name: "frequencies" })
export default class FrequencyEntity extends AbstractEntity {
  @ManyToOne(() => FoodEntity, { nullable: true })
  food!: FoodEntity;

  @ManyToOne(() => FoodEntity, { nullable: true })
  nextCheckFood!: FoodEntity;
}

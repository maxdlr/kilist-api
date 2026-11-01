import { Entity, ManyToOne } from "typeorm";
import { AbstractEntity } from "./AbstractEntity";
import FoodEntity from "./FoodEntity";
import HouseholdEntity from "./HouseholdEntity";

@Entity({ name: "frequencies" })
export default class FrequencyEntity extends AbstractEntity {
  @ManyToOne(() => FoodEntity, { nullable: true, onDelete: "CASCADE" })
  food!: FoodEntity | number;

  @ManyToOne(() => FoodEntity, { nullable: true, onDelete: "CASCADE" })
  nextBoughtFood!: FoodEntity | number;

  @ManyToOne(() => HouseholdEntity, {
    nullable: false,
    onDelete: "CASCADE",
  })
  household!: HouseholdEntity;
}

import { Column, Entity } from "typeorm";
import { AbstractEntity } from "./AbstractEntity";

@Entity({ name: "food_categories" })
export default class FoodCategoryEntity extends AbstractEntity {
  @Column()
  name!: string;

  @Column({ default: "", length: 2000 })
  description?: string;
}

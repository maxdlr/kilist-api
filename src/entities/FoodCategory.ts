import { Column, Entity, ManyToOne } from "typeorm";
import { AbstractEntity } from "./AbstractEntity";
import HouseholdEntity from "./HouseholdEntity";

@Entity({ name: "food_categories" })
export default class FoodCategoryEntity extends AbstractEntity {
  @Column()
  name!: string;

  @Column({ default: "", length: 2000 })
  description?: string;

  @ManyToOne(() => HouseholdEntity, {
    nullable: false,
    onDelete: "CASCADE",
  })
  household!: HouseholdEntity;
}

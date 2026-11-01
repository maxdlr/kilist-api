import { IsNotEmpty } from "class-validator";
import { Column, Entity, JoinTable, ManyToMany, ManyToOne } from "typeorm";
import { AbstractEntity } from "./AbstractEntity";
import HouseholdEntity from "./HouseholdEntity";
import FoodEntity from "./FoodEntity";

@Entity({ name: "lists" })
export default class ListEntity extends AbstractEntity {
  @Column({ default: "New list", length: 2000 })
  @IsNotEmpty({ message: "Required" })
  title!: string;

  @ManyToMany(() => FoodEntity, (food) => food.lists)
  @JoinTable()
  foods!: FoodEntity[];

  @ManyToOne(() => HouseholdEntity, {
    nullable: false,
    eager: true,
    onDelete: "CASCADE",
  })
  household!: HouseholdEntity;

  @Column({ nullable: true, length: 2000 })
  description?: string;

  @Column({ default: true })
  isMain: boolean = true;
}

import { Column, Entity, JoinTable, ManyToMany } from "typeorm";
import { AbstractEntity } from "./AbstractEntity";
import GroceryListEntity from "./GroceryListEntity";

@Entity({ name: "grocery_items" })
export default class GroceryItemEntity extends AbstractEntity {
  @Column()
  name!: string;

  @Column({ nullable: true })
  image!: string;

  @ManyToMany(() => GroceryListEntity)
  @JoinTable()
  lists!: GroceryListEntity;

  @Column({ default: "", length: 2000 })
  description?: string;
}

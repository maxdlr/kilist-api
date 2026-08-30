import { IsNotEmpty } from "class-validator";
import { Column, Entity, JoinTable, ManyToMany, ManyToOne } from "typeorm";
import { AbstractEntity } from "./AbstractEntity";
import GroceryItemEntity from "./GroceryItemEntity";
import UserEntity from "./UserEntity";

@Entity({ name: "grocery_lists" })
export default class GroceryListEntity extends AbstractEntity {
  @Column({ default: "New list", length: 2000 })
  @IsNotEmpty({ message: "Required" })
  title!: string;

  @ManyToMany(() => GroceryItemEntity)
  @JoinTable()
  items!: GroceryItemEntity[];

  @ManyToOne(() => UserEntity, (user) => user.lists, {
    nullable: false,
    eager: true,
    onDelete: "CASCADE",
  })
  user!: UserEntity;

  @Column({ nullable: true, length: 2000 })
  description?: string;
}

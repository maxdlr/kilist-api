import { IsNotEmpty } from "class-validator";
import { Column, Entity, JoinTable, ManyToMany, ManyToOne } from "typeorm";
import { AbstractEntity } from "./AbstractEntity";
import UserEntity from "./UserEntity";
import FoodEntity from "./FoodEntity";

@Entity({ name: "lists" })
export default class ListEntity extends AbstractEntity {
  @Column({ default: "New list", length: 2000 })
  @IsNotEmpty({ message: "Required" })
  title!: string;

  @ManyToMany(() => FoodEntity, (food) => food.lists)
  @JoinTable()
  foods!: FoodEntity[];

  @ManyToOne(() => UserEntity, (user) => user.lists, {
    nullable: false,
    eager: true,
    onDelete: "CASCADE",
  })
  user!: UserEntity;

  @Column({ nullable: true, length: 2000 })
  description?: string;
}

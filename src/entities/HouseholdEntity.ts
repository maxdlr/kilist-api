import { Column, Entity, OneToMany } from "typeorm";
import { AbstractEntity } from "./AbstractEntity";
import UserEntity from "./UserEntity";

@Entity({ name: "households" })
export default class HouseholdEntity extends AbstractEntity {
  @Column({ nullable: true, length: 100 })
  name?: string;

  @Column({ unique: true })
  joinCode!: string;

  @OneToMany(() => UserEntity, (user) => user.household)
  members!: UserEntity[];
}

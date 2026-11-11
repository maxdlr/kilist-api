import { Column, Entity, OneToMany } from "typeorm";
import { AbstractEntity } from "./AbstractEntity";
import UserEntity from "./UserEntity";

export type DeclinedSuggestion = { at: string; count: number };

@Entity({ name: "households" })
export default class HouseholdEntity extends AbstractEntity {
  @Column({ nullable: true, length: 100 })
  name?: string;

  @Column({ unique: true })
  joinCode!: string;

  @Column({ type: "simple-json", nullable: true })
  eaterProfiles?: string[] | null;

  @Column({ type: "simple-json", nullable: true })
  declinedSuggestions?: Record<string, DeclinedSuggestion> | null;

  @OneToMany(() => UserEntity, (user) => user.household)
  members!: UserEntity[];
}

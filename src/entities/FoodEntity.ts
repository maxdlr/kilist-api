import { IsNotEmpty, IsOptional, IsUrl } from "class-validator";
import { Column, Entity, ManyToMany, ManyToOne, OneToMany } from "typeorm";
import { AbstractEntity } from "./AbstractEntity";
import FoodHistoryEntity from "./FoodHistoryEntity";
import HouseholdEntity from "./HouseholdEntity";
import ListEntity from "./ListEntity";

@Entity({ name: "foods" })
export default class FoodEntity extends AbstractEntity {
  @Column()
  @IsNotEmpty({ message: "validation.name.required" })
  name!: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsUrl({}, { message: "validation.url.invalid" })
  imageUrl!: string;

  @ManyToMany(() => ListEntity, (list) => list.foods, { nullable: true })
  lists!: ListEntity[];

  @Column({ type: "varchar", nullable: true })
  icon?: string | null;

  @Column({ type: "simple-json", nullable: true })
  barcodes?: string[] | null;

  @Column({ type: "varchar", length: 40, nullable: true })
  quantity?: string | null;

  @Column({ type: "float", default: 1 })
  inStockScore!: number;

  @OneToMany(() => FoodHistoryEntity, (foodHistory) => foodHistory.food)
  foodHistories!: FoodHistoryEntity[];

  @Column({ default: "", length: 2000 })
  description?: string;

  @Column({ nullable: true })
  snoozedUntil!: Date;

  @Column({ type: "datetime", precision: 6, nullable: true })
  lastBoughtAt?: Date | null;

  @Column({ type: "simple-json", nullable: true })
  boughtDates?: string[] | null;

  @Column({ type: "datetime", precision: 6, nullable: true })
  editedAt?: Date | null;

  @ManyToOne(() => HouseholdEntity, {
    nullable: false,
    onDelete: "CASCADE",
  })
  household!: HouseholdEntity;
}

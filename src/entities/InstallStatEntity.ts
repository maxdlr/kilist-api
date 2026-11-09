import { Column, Entity, Index } from "typeorm";
import { AbstractEntity } from "./AbstractEntity";

@Entity({ name: "install_stats" })
@Index(["installId", "day"], { unique: true })
export default class InstallStatEntity extends AbstractEntity {
  @Column({ type: "varchar", length: 64 })
  installId!: string;

  @Column({ type: "varchar", length: 10 })
  @Index()
  day!: string;

  @Column({ type: "varchar", length: 32, default: "" })
  appVersion!: string;

  @Column({ type: "varchar", length: 16, default: "" })
  platform!: string;

  @Column({ type: "boolean", default: true })
  guest!: boolean;

  @Column({ type: "varchar", length: 32, default: "" })
  skin!: string;

  @Column({ type: "int", default: 0 })
  foods!: number;

  @Column({ type: "int", default: 0 })
  rounds!: number;

  @Column({ type: "int", default: 0 })
  cards!: number;

  @Column({ type: "int", default: 0 })
  runs!: number;

  @Column({ type: "int", default: 0 })
  suggestionsTaken!: number;

  @Column({ type: "int", default: 0 })
  errors!: number;

  @Column({ type: "int", default: 0 })
  gatesHousehold!: number;

  @Column({ type: "int", default: 0 })
  gatesVersus!: number;

  @Column({ type: "int", default: 0 })
  signups!: number;

  @Column({ type: "int", default: 0 })
  signupsAfterGate!: number;
}

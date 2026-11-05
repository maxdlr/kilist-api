import { Column, Entity, Index, ManyToOne } from "typeorm";
import { AbstractEntity } from "./AbstractEntity";
import UserEntity from "./UserEntity";

@Entity({ name: "admin_job_runs" })
@Index(["jobId", "createdAt"])
export default class AdminJobRunEntity extends AbstractEntity {
  @Column({ type: "varchar", length: 64 })
  jobId!: string;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: "SET NULL" })
  ranBy?: UserEntity | null;

  @Column({ type: "boolean" })
  dryRun!: boolean;

  @Column({ type: "int" })
  affected!: number;

  @Column({ type: "varchar", length: 500 })
  summary!: string;
}

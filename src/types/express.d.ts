import UserEntity from "@/entities/UserEntity";
import "express";

declare module "express" {
  interface Request {
    user?: UserEntity;
  }
}

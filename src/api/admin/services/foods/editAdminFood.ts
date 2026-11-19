import { RULES } from "@/api/catalog/rules";
import findFoodIcon from "@/api/food-bank/findFoodIcon";
import FoodEntity from "@/entities/FoodEntity";
import UserEntity from "@/entities/UserEntity";
import inTransaction from "@/helpers/inTransaction";
import { EntityManager } from "typeorm";
import { foodLabel, text } from "../../helpers";
import logAction from "../actions/logAction";
import loadFood from "./loadFood";

const editAdminFood = (admin: UserEntity, id: number, body: Record<string, any> | undefined, manager?: EntityManager) =>
  inTransaction(manager, async (m) => {
    const food = await loadFood(id, m);
    const changes: Partial<FoodEntity> = {};
    const notes: string[] = [];
    const name = text(body?.name, "name", { optional: true, max: 120 });
    if (name && name !== food.name) {
      changes.name = name;
      notes.push(`renamed to ${name}`);
      if (!(body && "icon" in body)) changes.icon = findFoodIcon(name) ?? null;
    }
    if (body && "note" in body) {
      const note = text(body.note, "note", { optional: true, max: RULES.products.noteLength }) || null;
      if (note !== (food.note ?? null)) {
        changes.note = note;
        notes.push("note changed");
      }
    }
    if (body && "icon" in body) {
      const icon = body.icon === null ? null : text(body.icon, "icon", { max: 64 })!;
      if (icon !== (food.icon ?? null)) {
        changes.icon = icon;
        notes.push(`icon → ${icon ?? "none"}`);
      }
    }
    if (notes.length || "icon" in changes) {
      await m.update(FoodEntity, id, changes);
      await logAction(admin, "food", id, `Edited ${foodLabel(food)}: ${notes.join(", ") || "icon matched again"}`, m);
    }
    return { changed: notes.length };
  });

export default editAdminFood;

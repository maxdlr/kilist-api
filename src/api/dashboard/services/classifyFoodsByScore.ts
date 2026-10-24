import FoodEntity from "@/entities/FoodEntity";

export const classifyFoodsByScore = (
  foods: FoodEntity[],
): Record<0 | 0.25 | 0.5 | 0.75 | 1, FoodEntity[]> => {
  const levels: number[] = [0, 0.25, 0.5, 0.75, 1];

  const result = foods.reduce<Record<0 | 0.25 | 0.5 | 0.75 | 1, FoodEntity[]>>(
    (acc, food) => {
      const inStockScore: number = food.inStockScore || 0;

      const closestLevel = levels.reduce((prev, curr) =>
        Math.abs(curr - inStockScore) < Math.abs(prev - inStockScore)
          ? curr
          : prev,
      ) as 0 | 0.25 | 0.5 | 0.75 | 1;

      acc[closestLevel].push(food);

      return acc;
    },
    {
      0: [],
      0.25: [],
      0.5: [],
      0.75: [],
      1: [],
    },
  );

  return result;
};

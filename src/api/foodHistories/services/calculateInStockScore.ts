import FoodHistoryEntity from "@/entities/FoodHistoryEntity";

const calculateInStockScore = (inStockScores: FoodHistoryEntity[]) => {
  const totalScores = inStockScores.length;
  const inStockCount = inStockScores.filter((score) => score.isInStock).length;

  if (totalScores === 0) {
    return 1;
  }

  const result = inStockCount / totalScores;

  return Number(result.toFixed(2));
};

export default calculateInStockScore;

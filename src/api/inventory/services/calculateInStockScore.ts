import InStockScoreEntity from "@/entities/InStockScoreEntity";

const calculateInStockScore = (inStockScores: InStockScoreEntity[]) => {
  const totalScores = inStockScores.length;
  const inStockCount = inStockScores.filter((score) => score.isInStock).length;

  if (totalScores === 0) {
    return 0;
  }

  const result = inStockCount / totalScores;

  return Number(result.toFixed(2));
};

export default calculateInStockScore;

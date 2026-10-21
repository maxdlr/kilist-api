import FoodEntity from "@/entities/FoodEntity";
import ShopListEntity from "@/entities/ShopListEntity";

const findShopListRemainingFoods = (shopList: ShopListEntity) => {
  return (shopList.startFoods as FoodEntity[]).filter((food) => {
    return (
      !(shopList.boughtFoods as FoodEntity[])
        .map((f) => f.id)
        .includes(food.id) && new Date(food.snoozedUntil || 0) < new Date()
    );
  });
};

export default findShopListRemainingFoods;

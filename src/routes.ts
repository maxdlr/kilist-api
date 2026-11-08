import { Router } from "express";
import userRoutes from "./api/users/routes/index";
import dashboardRoutes from "./api/dashboard/routes/index";
import listsRoutes from "./api/lists/routes/index";
import foodsRoutes from "./api/foods/routes/index";
import shopListRoutes from "./api/shop-list/routes/index";
import swipeListRoutes from "./api/swipe-list/routes/index";
import foodHistoriesRoutes from "./api/foodHistories/routes/index";
import householdsRoutes from "./api/households/routes/index";
import foodBankRoutes from "./api/food-bank/routes/index";
import prizesRoutes from "./api/prizes/routes/index";
import adminRoutes from "./api/admin/routes/index";
import versusRoutes from "./api/versus/routes/index";
import emailRoutes from "./api/emails/routes/index";
import getMe from "./api/auth/controllers/getMe";
import editMyLanguage from "./api/auth/controllers/editMyLanguage";
import editMySkin from "./api/auth/controllers/editMySkin";
import logIn from "./api/auth/controllers/logIn";
import authenticate from "./middlewares/authenticate";
import getRefreshToken from "./api/auth/controllers/getRefreshToken";
import logOut from "./api/auth/controllers/logOut";
import signUp from "./api/auth/controllers/signup";
import getHealth from "./api/health/getHeath";

const router = Router();

router.get("/health", getHealth);

router.post("/login", logIn);
router.post("/signup", signUp);
router.post("/logout", authenticate, logOut);
router.post("/refresh", getRefreshToken);

router.get("/me", authenticate, getMe);
router.put("/me/skin", authenticate, editMySkin);
router.put("/me/language", authenticate, editMyLanguage);

router.use("/users", userRoutes);

router.use("/lists", listsRoutes);

router.use("/foods", foodsRoutes);

router.use("/shop-list", shopListRoutes);

router.use("/swipe-list", swipeListRoutes);

router.use("/food-histories", foodHistoriesRoutes);

router.use("/households", householdsRoutes);

router.use("/food-bank", foodBankRoutes);

router.use("/dashboard", dashboardRoutes);

router.use("/prizes", prizesRoutes);

router.use("/admin", adminRoutes);

router.use("/versus", versusRoutes);

if (process.env.NODE_ENV !== "production") {
  router.use("/emails", emailRoutes);
}

export default router;

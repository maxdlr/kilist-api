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
import syncRoutes from "./api/sync/routes/index";
import catalogRoutes from "./api/catalog/routes/index";
import installStatsRoutes from "./api/installStats/routes/index";
import getMe from "./api/auth/controllers/getMe";
import editMyLanguage from "./api/auth/controllers/editMyLanguage";
import editMySkin from "./api/auth/controllers/editMySkin";
import logIn from "./api/auth/controllers/logIn";
import authenticate from "./middlewares/authenticate";
import getRefreshToken from "./api/auth/controllers/getRefreshToken";
import logOut from "./api/auth/controllers/logOut";
import signUp from "./api/auth/controllers/signup";
import getHealth from "./api/health/getHeath";
import forgotPassword from "./api/auth/controllers/forgotPassword";
import resetPassword from "./api/auth/controllers/resetPassword";
import sendEmailCode from "./api/auth/controllers/sendEmailCode";
import confirmEmail from "./api/auth/controllers/confirmEmail";
import codeLimit from "./middlewares/codeLimit";
import postPushToken from "./api/push/controllers/postPushToken";
import deletePushToken from "./api/push/controllers/deletePushToken";

const router = Router();

router.get("/health", getHealth);
router.use("/catalog", catalogRoutes);
router.use("/stats", installStatsRoutes);

router.post("/login", logIn);
router.post("/signup", signUp);
router.post("/logout", authenticate, logOut);
router.post("/refresh", getRefreshToken);
router.post("/password/forgot", codeLimit, forgotPassword);
router.post("/password/reset", codeLimit, resetPassword);

router.get("/me", authenticate, getMe);
router.put("/me/skin", authenticate, editMySkin);
router.put("/me/language", authenticate, editMyLanguage);
router.post("/me/email/code", codeLimit, authenticate, sendEmailCode);
router.post("/me/email/confirm", codeLimit, authenticate, confirmEmail);
router.post("/me/push-token", authenticate, postPushToken);
router.delete("/me/push-token", authenticate, deletePushToken);

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

router.use("/sync", syncRoutes);

if (process.env.NODE_ENV !== "production") {
  router.use("/emails", emailRoutes);
}

export default router;

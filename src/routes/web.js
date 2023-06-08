import express from "express";
import homeController from "../controller/homeController";
import apiController from "../controller/apiController";
import loginController from "../controller/loginController";
import passportController from "../controller/passportController";
import passport from "passport";
import checkUser from "../middleware/checkUser";

const router = express.Router();

/**
 *
 * @param {*} app : express app
 */

const initWebRoutes = (app) => {
  //path, handler
  router.get("/", checkUser.isLogin, homeController.handleHelloWord);
  router.get("/user", homeController.handleUserPage);
  router.post("/users/create-user", homeController.handleCreateNewUser);
  router.post("/delete-user/:id", homeController.handleDelteUser);
  router.get("/update-user/:id", homeController.getUpdateUserPage);
  router.post("/user/update-user", homeController.handleUpdateUser);

  //rest api
  //GET - R, POST- C, PUT - U, DELETE - D
  router.get("/api/test-api", apiController.testApi);

  router.get("/login", checkUser.isLogin, loginController.getLoginPage);

  router.post("/login", function (req, res, next) {
    passport.authenticate("local", function (error, user, info) {
      if (error) {
        return res.status(500).json(error);
      }
      if (!user) {
        return res.status(401).json(info.message);
      }

      req.login(user, function (err) {
        if (err) return next(err);

        console.log("req.body.serviceURL: ", req.body.serviceURL);
        return res
          .status(200)
          .json({ ...user, redirectURL: req.body.serviceURL });
      });
    })(req, res, next);
  });

  router.post("/logout", passportController.handleLogout);

  router.post("/verify-token", loginController.verifySSOToken);

  router.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  router.get(
    "/google/redirect",
    passport.authenticate("google", {
      failureRedirect: "/login",
    }),
    function (req, res) {
      // Successful authentication, redirect home.

      // Save cookies
      return res.render("social.ejs", { ssoToken: req.user.code });
    }
  );

  router.get(
    "/auth/facebook",
    passport.authorize("facebook", { scope: ["email"] })
  );

  router.get(
    "/facebook/redirect",
    passport.authenticate("facebook", {
      failureRedirect: "/login",
    }),
    function (req, res) {
      // Successful authentication, redirect home.
      return res.render("social.ejs", { ssoToken: req.user.code });
    }
  );

  return app.use("/", router);
};

export default initWebRoutes;

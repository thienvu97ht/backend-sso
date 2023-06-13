import { v4 as uuidv4 } from "uuid";
import { createJWT } from "../middleware/JWTAction";
import loginRegisterService from "../service/loginRegisterService";
require("dotenv").config();

const getLoginPage = (req, res) => {
  // validate, redis
  const { serviceURL } = req.query;
  return res.render("login.ejs", {
    redirectURL: serviceURL,
  });
};

const verifySSOToken = async (req, res) => {
  try {
    // return jwt, refresh token
    const ssoToken = req.body.ssoToken;

    // check ssoToken
    if (req.user && req.user.code && req.user.code === ssoToken) {
      const refreshToken = uuidv4();

      // update user
      await loginRegisterService.updateUserRefreshToken(
        req.user.email,
        refreshToken
      );

      // create jwt token
      let payload = {
        email: req.user.email,
        groupWithRoles: req.user.groupWithRoles,
        username: req.user.username,
      };
      let token = createJWT(payload);

      // set cookies
      res.cookie("access_token", token, {
        maxAge: process.env.MAX_AGE_ACCESS_TOKEN, // 5s
        httpOnly: true,
      });

      res.cookie("refresh_token", refreshToken, {
        maxAge: process.env.MAX_AGE_REFRESH_TOKEN, // 1h
        httpOnly: true,
      });

      const resData = {
        access_token: token,
        refresh_token: refreshToken,
        groupWithRoles: req.user.groupWithRoles,
        email: req.user.email,
        username: req.user.username,
      };

      // destroy session
      req.session.destroy(function (err) {
        req.logout();
      });

      return res.status(200).json({
        EM: "ok",
        EC: 0,
        DT: resData,
      });
    } else {
      return res.status(401).json({
        EM: "Note match ssoToken",
        EC: 1,
        DT: "",
      });
    }
  } catch (error) {
    console.log("🏆 ~ verifySSOToken ~ error:", error);
    return res.status(500).json({
      EM: "Something wrong in the server...",
      EC: -1,
      DT: "",
    });
  }
};

module.exports = {
  getLoginPage,
  verifySSOToken,
};

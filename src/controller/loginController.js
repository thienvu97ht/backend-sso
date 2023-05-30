import { v4 as uuidv4 } from "uuid";
import { createJWT } from "../middleware/JWTAction";
import loginRegisterService from "../service/loginRegisterService";

const getLoginPage = (req, res) => {
  // validate, redis
  const { serviceURL } = req.query;
  return res.render("login.ejs", {
    redirectURL: serviceURL,
  });
};

const verifySSOToken = async (req, res) => {
  const ssoToken = req.body.ssoToken;

  if (req.user && req.user.code && req.user.code === ssoToken) {
    const refreshToken = uuidv4();

    // update user
    await loginRegisterService.updateUserRefreshToken(
      req.user.email,
      refreshToken
    );

    // create jwt token
    let payload = {
      groupWithRoles: req.user.groupWithRoles,
      email: req.user.email,
      username: req.user.username,
    };
    let token = createJWT(payload);

    const resData = {
      access_token: token,
      refresh_toke: refreshToken,
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
    return res.status(200).json({
      EM: "ok",
      EC: 0,
      DT: "note match",
    });
  }
};

module.exports = {
  getLoginPage,
  verifySSOToken,
};

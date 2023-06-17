import nodemailer from "nodemailer";
import { v4 as uuidv4 } from "uuid";
import { createJWT } from "../middleware/JWTAction";
import loginRegisterService from "../service/loginRegisterService";
import * as handlebars from "handlebars";
import * as fs from "fs";
import * as path from "path";

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

const getResetPasswordPage = (req, res) => {
  return res.render("forgot-password.ejs");
};

const sendCode = async (req, res) => {
  // validate email, check type account equal LOCAL
  let checkEmailLocal = await loginRegisterService.isEmailLocal(req.body.email);
  console.log("🏆 ~ sendCode ~ checkEmailLocal:", checkEmailLocal);
  if (!checkEmailLocal) {
    return res.status(401).json({
      EC: -1,
      DT: "",
      EM: `Not found the email: ${req.body.email} in the system`,
    });
  }

  // send code via email
  const otp = Math.floor(100000 + Math.random() * 900000);
  const filePath = path.join(__dirname, "../templates/reset-password.html");
  const source = fs.readFileSync(filePath, "utf-8").toString();
  const template = handlebars.compile(source);
  const replacements = {
    email: req.body.email,
    otp: otp,
  };
  const htmlToSend = template(replacements);

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.GOOGLE_APP_EMAIL, // generated ethereal user
      pass: process.env.GOOGLE_APP_PASSWORD, // generated ethereal password
    },
  });

  res.status(200).json({
    EC: 0,
    DT: {
      email: req.body.email,
    },
  });

  console.log(">>> START SENDING EMAIL....");
  // send mail with defined transport object
  try {
    await transporter.sendMail({
      from: `"Vũ đẹp trai 👻" <${process.env.GOOGLE_APP_EMAIL}>`, // sender address
      to: req.body.email, // list of receivers
      subject: "Hello ✔", // Subject line
      text: "Hello world?", // plain text body
      html: htmlToSend,
    });

    // update code in database
    await loginRegisterService.updateUserCode(otp, req.body.email);

    console.log(">>> END SENDING EMAIL....");
  } catch (error) {
    console.log("🏆 ~ sendCode ~ error:", error);
  }
};

const handleResetPassword = async (req, res) => {
  try {
    let result = await loginRegisterService.resetUserPassword(req.body);

    if (result) {
      return res.status(200).json({
        EC: 0,
      });
    } else {
      return res.status(500).json({
        EC: -1,
        EM: "Something wrong, please try again",
        DT: "",
      });
    }
  } catch (error) {
    return res.status(500).json({
      EC: -2,
      EM: "Internal error",
      DT: "",
    });
  }
};

module.exports = {
  getLoginPage,
  verifySSOToken,
  getResetPasswordPage,
  sendCode,
  handleResetPassword,
};

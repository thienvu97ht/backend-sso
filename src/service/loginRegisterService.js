require("dotenv").config();
import bcrypt from "bcryptjs";
import { Op } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import db from "../models/index";
import { getGroupWithRoles } from "./JWTService";

const salt = bcrypt.genSaltSync(10);

const hashUserPassword = (userPassword) => {
  let hashPassword = bcrypt.hashSync(userPassword, salt);
  return hashPassword;
};

const checkEmailExist = async (userEmail) => {
  let user = await db.User.findOne({
    where: { email: userEmail },
  });

  if (user) {
    return true;
  }
  return false;
};

const checkPhoneExist = async (userPhone) => {
  let user = await db.User.findOne({
    where: { phone: userPhone },
  });

  if (user) {
    return true;
  }
  return false;
};

const registerNewUser = async (rawUserData) => {
  try {
    //check email/phonenumber are exist
    let isEmailExist = await checkEmailExist(rawUserData.email);
    if (isEmailExist === true) {
      return {
        EM: "The email is already exist",
        EC: 1,
      };
    }
    let isPhoneExist = await checkPhoneExist(rawUserData.phone);
    if (isPhoneExist === true) {
      return {
        EM: "The phone number is already exist",
        EC: 1,
      };
    }
    //hash user password
    let hashPassword = hashUserPassword(rawUserData.password);

    //create new user
    await db.User.create({
      email: rawUserData.email,
      username: rawUserData.username,
      password: hashPassword,
      phone: rawUserData.phone,
      groupId: 4,
    });

    return {
      EM: "A user is created successfully!",
      EC: "0",
    };
  } catch (e) {
    console.log(e);
    return {
      EM: "Somthing wrongs in service...",
      EC: -2,
    };
  }
};

const checkPassword = (inputPassword, hashPassword) => {
  return bcrypt.compareSync(inputPassword, hashPassword); // true or false
};

const handleUserLogin = async (rawData) => {
  try {
    let user = await db.User.findOne({
      where: {
        [Op.or]: [{ email: rawData.valueLogin }, { phone: rawData.valueLogin }],
        type: "LOCAL",
      },
    });

    if (user) {
      let isCorrectPassword = checkPassword(rawData.password, user.password);
      if (isCorrectPassword === true) {
        const code = uuidv4();
        let groupWithRoles = await getGroupWithRoles(user);
        return {
          EM: "ok!",
          EC: 0,
          DT: {
            groupWithRoles,
            username: user.username,
            code: code,
            email: user.email,
          },
        };
      } else {
        // return {
        //   EM: "Your password is incorrect!",
        //   EC: 1,
        //   DT: "",
        // };
      }
    }

    return {
      EM: "Your email/phone number or password is incorrect!",
      // EM: "Your email/phone is incorrect!",
      EC: 2,
      DT: "",
    };
  } catch (error) {
    console.log(error);
    return {
      EM: "Something wrongs in service...",
      EC: -2,
    };
  }
};

const updateUserRefreshToken = async (email, token) => {
  try {
    await db.User.update(
      {
        refreshToken: token,
      },
      {
        where: { email },
      }
    );
  } catch (error) {
    console.log("🏆 ~ updateUserRefreshToken ~ error:", error);
  }
};

const upsertUserSocialMedial = async (typeAcc, dataRaw) => {
  try {
    let user = null;

    user = await db.User.findOne({
      where: {
        email: dataRaw.email,
        type: typeAcc,
      },
      raw: true,
    });

    if (!user) {
      // create new account
      user = await db.User.create({
        email: dataRaw.email,
        username: dataRaw.username,
        type: typeAcc,
      });
      user = user.get({ plain: true });
    }
    return user;
  } catch (error) {
    console.log("🏆 ~ loi roi ne", error);
  }
};

const getUserByRefreshToken = async (token) => {
  try {
    let user = await db.User.findOne({
      where: { refreshToken: token },
    });

    if (user) {
      let groupWithRoles = await getGroupWithRoles(user);

      return {
        email: user.email,
        groupWithRoles: groupWithRoles,
        username: user.username,
      };
    }

    return null;
  } catch (error) {
    console.log("🏆 ~ getUserByRefreshToken ~ error:", error);
  }
};

const updateUserCode = async (code, email) => {
  try {
    await db.User.update(
      {
        code: code,
      },
      {
        where: { email: email.trim(), type: "LOCAL" },
      }
    );
  } catch (error) {
    console.log("🏆 ~ updateUserRefreshToken ~ error:", error);
  }
};

const isEmailLocal = async (email) => {
  try {
    let user = await db.User.findOne({
      where: {
        email: email,
        type: "LOCAL",
      },
    });

    if (!!user) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.log("🏆 ~ isEmailLocal ~ error:", error);
  }
};

const resetUserPassword = async (rawData) => {
  try {
    let newPassword = hashUserPassword(rawData.newPassword);

    let [count] = await db.User.update(
      {
        password: newPassword,
      },
      {
        where: {
          email: rawData.email,
          type: "LOCAL",
          code: rawData.code,
        },
      }
    );

    if (count > 0) {
      return true;
    }

    return false;
  } catch (error) {
    return false;
    console.log("🏆 ~ resetUserPassword ~ error:", error);
  }
};

module.exports = {
  registerNewUser,
  handleUserLogin,
  hashUserPassword,
  checkEmailExist,
  checkPhoneExist,
  updateUserRefreshToken,
  upsertUserSocialMedial,
  getUserByRefreshToken,
  updateUserCode,
  isEmailLocal,
  resetUserPassword,
};

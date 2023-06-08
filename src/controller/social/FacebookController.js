require("dotenv").config();
import passport from "passport";
import loginRegisterService from "../../service/loginRegisterService";
import { v4 as uuidv4 } from "uuid";
// import { Strategy as FacebookStrategy } from "passport-facebook";

const FacebookStrategy = require("passport-facebook").Strategy;

const configLoginWithFacebook = () => {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: process.env.FACEBOOK_APP_REDIRECT_LOGIN,
        profileFields: ["id", "emails", "name", "displayName"],
      },
      async function (accessToken, refreshToken, profile, cb) {
        const typeAcc = "FACEBOOK";
        const dataRaw = {
          username: profile.displayName,
          email: profile._json.email || profile.id,
        };

        let user = await loginRegisterService.upsertUserSocialMedial(
          typeAcc,
          dataRaw
        );

        user.code = uuidv4();
        return cb(null, user);
      }
    )
  );
};

export default configLoginWithFacebook;

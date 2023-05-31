require("dotenv").config();
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import passport from "passport";
import loginRegisterService from "../../service/loginRegisterService";

const configLoginWithGoogle = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_APP_CLIENT_ID,
        clientSecret: process.env.GOOGLE_APP_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_APP_REDIRECT_LOGIN,
      },
      async function (accessToken, refreshToken, profile, cb) {
        const type = "GOOGLE";
        const dataRaw = {
          username: profile.displayName,
          email: profile._json.email,
          googleId: profile.id,
        };

        let user = await loginRegisterService.upsertUserSocialMedial(
          type,
          dataRaw
        );
        return cb(null, user);
      }
    )
  );
};

export default configLoginWithGoogle;

import passport from "passport";
import LocalStrategy from "passport-local";
import loginRegisterService from "../service/loginRegisterService";

const configPassport = () => {
  passport.use(
    new LocalStrategy(
      {
        passReqToCallback: true,
      },
      async function verify(req, username, password, cb) {
        const rawData = {
          valueLogin: username,
          password: password,
        };

        let res = await loginRegisterService.handleUserLogin(rawData);
        if (res && +res.EC === 0) {
          return cb(null, res.DT);
        } else {
          return cb(
            null,
            false,
            req.flash("message", [res.EM, username, res.EC])
          );
        }
      }
    )
  );
};

const handleLogout = (req, res) => {
  req.logOut();
  req.session.destroy(function (err) {
    res.redirect("/"); //Inside a callback… bulletproof!
  });
};

module.exports = {
  configPassport,
  handleLogout,
};

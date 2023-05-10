import Sequelize from "sequelize";
import session, { Store } from "express-session";
import sequelizeStore from "connect-session-sequelize";
import passport from "passport";

const configSession = (app) => {
  // initialize sequelize with session store
  const SequelizeStore = sequelizeStore(Store);

  const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USERNAME,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: process.env.DB_DIALECT,
      logging: false,
      define: {
        freezeTableName: true,
      },
    }
  );

  const myStore = new SequelizeStore({
    db: sequelize,
  });

  app.use(
    session({
      secret: "keyboard cat",
      store: myStore,
      resave: false, // we support the touch method so per the express-session docs this should be set to false
      proxy: true, // if you do SSL outside of node.
      saveUninitialized: false,
    })
  );

  myStore.sync();

  app.use(passport.authenticate("session"));

  passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
      cb(null, user);
    });
  });

  passport.deserializeUser(function (user, cb) {
    process.nextTick(function () {
      return cb(null, user);
    });
  });
};

export default configSession;

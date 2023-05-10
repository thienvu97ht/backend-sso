import Sequelize from "sequelize";
import session, { Store } from "express-session";
import sequelizeStore from "connect-session-sequelize";

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

  app.use(
    session({
      secret: "keyboard cat",
      store: new SequelizeStore({
        db: sequelize,
      }),
      resave: false, // we support the touch method so per the express-session docs this should be set to false
      proxy: true, // if you do SSL outside of node.
    })
  );
};

export default configSession;

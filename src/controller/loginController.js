const getLoginPage = (req, res) => {
  // validate, redis
  const { serviceURL } = req.query;
  return res.render("login.ejs", {
    redirectURL: serviceURL,
  });
};

const verifySSOToken = (req, res) => {
  console.log("🏆 ~ verifySSOToken ~ req:", req.body);
  return res.status(200).json({
    EM: "ok",
    EC: 0,
    DT: req.body.ssoToken,
  });
};

module.exports = {
  getLoginPage,
  verifySSOToken,
};

const getLoginPage = (req, res) => {
  // validate, redis
  const { serviceURL } = req.query;
  console.log("🏆 ~ getLoginPage ~ serviceURL:", serviceURL);
  return res.render("login.ejs", {
    redirectURL: serviceURL,
  });
};

module.exports = {
  getLoginPage,
};

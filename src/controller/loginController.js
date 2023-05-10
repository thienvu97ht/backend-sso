const getLoginPage = (req, res) => {
  const arrMessage = req.flash("message");

  return res.render("login.ejs", {
    error: arrMessage[0],
    usernameInput: arrMessage[1],
  });
};

module.exports = {
  getLoginPage,
};

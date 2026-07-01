module.exports = {
  ...require("./crudController"),
  ...require("./statusController"),
  ...require("./settingsController"),
  ...require("./analyticsController"),
  ...require("./exportController"),
};

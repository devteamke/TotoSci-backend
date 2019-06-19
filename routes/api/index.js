const router = require("express").Router();
router.use("/admin", require("./admin"));
router.use("/manager", require("./manager"));
router.use("/chief-trainer", require("./chief"));
router.use("/trainer", require("./trainer"));
router.use("/instructor", require("./instructor"));
router.use("/users", require("./users"));

module.exports = router;

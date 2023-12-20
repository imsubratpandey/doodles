//server routes to handle get and post requests
const { register, userValidation, login } = require("../controllers/userControllers");
const router = require("express").Router();
router.post("/register", register);
router.post("/login", login);
router.post("/validate", userValidation);
module.exports = router;
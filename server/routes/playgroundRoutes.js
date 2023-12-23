//server routes to handle get and post requests
const { createPlayground, joinPlayground, playgroundValidation, playgroundDetails, addMessage } = require("../controllers/playgroundControllers");
const router = require("express").Router();
router.post("/create", createPlayground);
router.post("/join", joinPlayground);
router.post("/validate", playgroundValidation);
router.post("/details", playgroundDetails);
router.post("/addMessage", addMessage);
module.exports = router;
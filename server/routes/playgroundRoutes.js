//server routes to handle get and post requests
const { createPlayground, joinPlayground, playgroundValidation, playgroundDetails, addMessage, gameManager, clearMessage } = require("../controllers/playgroundControllers");
const router = require("express").Router();
router.post("/create", createPlayground);
router.post("/join", joinPlayground);
router.post("/validate", playgroundValidation);
router.post("/details", playgroundDetails);
router.post("/message", addMessage);
router.post("/manager", gameManager);
router.post("/clear", clearMessage);
module.exports = router;
const { Users, Sessions, Playgrounds } = require("../collections/mongoCollections");
const { randomUUID } = require("crypto");
const jwt = require("jsonwebtoken");

const isValidRequest = async (doodleId, token) => {
    const user = await Users.findOne({ doodleId: doodleId });
    if (!user)
        return false;
    let tokenId, tokenValid = false;
    jwt.verify(
        token,
        process.env.TOKEN_SECRET_KEY,
        (err, decoded) => {
            if (err) {
                return;
            }
            tokenValid = true;
            tokenId = decoded.tokenId;
        }
    );
    if (tokenValid === false)
        return false;
    const session = await Sessions.findOne({ tokenId: tokenId });
    if (!session)
        return false;
    if (session.doodleId !== doodleId)
        return false;
    return true;
};

//playground create request handler
module.exports.createPlayground = async (req, res, next) => {
    try {
        const { doodleId } = req.body;
        const token = req.cookies.token;
        const playgroundId = randomUUID();
        const playground = await Playgrounds.findOne({ playgroundId: playgroundId });
        if (playground)
            return res.status(200).json({ status: false, msg: "Playground already exist" });
        if (await isValidRequest(doodleId, token) === false)
            return res.status(200).json({ status: false, msg: "Request not processed" });
        const user = await Users.findOne({ doodleId: doodleId });
        await Playgrounds.insertOne({ createdAt: new Date(), owner: doodleId, playgroundId: playgroundId, gameInProgress: false, members: [{ doodleId: doodleId, username: user.username }], banMembers: [], messages: [] });
        return res.status(200).json({ status: true, playgroundId: playgroundId, msg: "Playground created" });
    }
    catch (ex) {
        next(ex);
    }
};

//playground join request handler
module.exports.joinPlayground = async (req, res, next) => {
    try {
        const { doodleId, playgroundId } = req.body;
        const token = req.cookies.token;
        const playground = await Playgrounds.findOne({ playgroundId: playgroundId });
        if (!playground)
            return res.status(200).json({ status: false, msg: "Playground does not exist" });
        if (await isValidRequest(doodleId, token) === false)
            return res.status(200).json({ status: false, msg: "Request not processed" });
        if (playground.gameInProgress === true)
            return res.status(200).json({ status: false, msg: "Game is already started" });
        return res.status(200).json({ status: true, playgroundId: playgroundId, msg: "Request Processed" });
    }
    catch (ex) {
        next(ex);
    }
};

//playground validation post request handler
module.exports.playgroundValidation = async (req, res, next) => {
    try {
        const { doodleId, playgroundId } = req.body;
        const token = req.cookies.token;
        const playground = await Playgrounds.findOne({ playgroundId: playgroundId });
        if (!playground)
            return res.status(200).json({ status: false, validated: false, msg: "Playground does not exist" });
        if (await isValidRequest(doodleId, token) === false)
            return res.status(200).json({ status: false, validated: false, msg: "Request not processed" });
        if (playground.gameInProgress === true)
            return res.status(200).json({ status: false, validated: false, msg: "Game is already started" });
        if (playground.owner === doodleId || playground.members.filter(element => element.doodleId === doodleId).length > 0)
            return res.status(200).json({ status: true, validated: true, msg: "Authorization not required" });
        return res.status(200).json({ status: true, validated: false, msg: "Authorization required" });
    }
    catch (ex) {
        next(ex);
    }
};

//playground details request handler
module.exports.playgroundDetails = async (req, res, next) => {
    try {
        const { doodleId, playgroundId } = req.body;
        const token = req.cookies.token;
        const playground = await Playgrounds.findOne({ playgroundId: playgroundId });
        if (!playground)
            return res.status(200).json({ status: false, msg: "Playground does not exist" });
        if (await isValidRequest(doodleId, token) === false)
            return res.status(200).json({ status: false, validated: false, msg: "Request not processed" });
        const user = await Users.findOne({ doodleId: doodleId });
        return res.status(200).json({ status: true, playgroundDetails: playground });
    }
    catch (ex) {
        next(ex);
    }
};

//add message request handler
module.exports.addMessage = async (req, res, next) => {
    try {
        const { playgroundId, doodleId, username, message } = req.body;
        const token = req.cookies.token;
        const playgroundDetails = await Playgrounds.findOne({ playgroundId: playgroundId });
        if (!playgroundDetails)
            return res.status(200).json({ status: false, msg: "Playground does not exist" });
        if (await isValidRequest(doodleId, token) === false)
            return res.status(200).json({ status: false, msg: "Request not processed" });
        await Playgrounds.updateOne({ playgroundId: playgroundId }, { $push: { messages: { from: username, message: message } } });
        return res.status(200).json({ status: true, msg: "Message added" });
    }
    catch (ex) {
        next(ex);
    }
};
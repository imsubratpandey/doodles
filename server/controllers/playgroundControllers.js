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

const getScore = (prevTime) => {
    const date = new Date();
    const currentTime = [date.getHours(), date.getMinutes(), date.getSeconds()];
    let timeDifference = (currentTime[0] * 3600 + currentTime[1] * 60 + currentTime[2]) - (prevTime[0] * 3600 + prevTime[1] * 60 + prevTime[2]);
    if (timeDifference < 0)
        return 100;
    else
        return Math.round((1 - timeDifference / 120) * 100);
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
        await Playgrounds.insertOne({ createdAt: new Date(), owner: doodleId, playgroundId: playgroundId, gameInProgress: false, roundPlayed: 0, members: [{ doodleId: doodleId, username: user.username, active: false, score: 0, totalScore: 0 }], banMembers: [], messages: [], rankingsData: [], drawerWord: "" });
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
        if (playground.owner === doodleId || playground.members.filter(element => element.doodleId === doodleId).length > 0)
            return res.status(200).json({ status: true, validated: true, msg: "Authorization not required" });
        if (playground.gameInProgress === true)
            return res.status(200).json({ status: false, validated: false, msg: "Game is already started" });
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
        const { playgroundId, drawerId, doodleId, username, message } = req.body;
        const token = req.cookies.token;
        const playground = await Playgrounds.findOne({ playgroundId: playgroundId });
        if (!playground)
            return res.status(200).json({ status: false, msg: "Playground does not exist" });
        if (await isValidRequest(doodleId, token) === false)
            return res.status(200).json({ status: false, msg: "Request not processed" });
        if (doodleId !== drawerId && message === playground.drawerWord) {
            const score = getScore(playground.canvasEnableTime);
            const members = playground.members;
            let prevScore, alreadyGuessed = true;
            members.forEach((member) => {
                if (member.doodleId === doodleId && member.score === 0) {
                    alreadyGuessed = false;
                    prevScore = member.totalScore;
                }
            });
            if (alreadyGuessed === true) {
                await Playgrounds.updateOne({ playgroundId: playgroundId }, { $push: { messages: { from: username, message: message } } });
                return res.status(200).json({ status: true, guessed: false, msg: "Message added" });
            }
            let newScore = score + prevScore;
            await Playgrounds.updateOne({ playgroundId: playgroundId }, { $push: { messages: { from: username, message: `${username} guessed the word` } } });
            await Playgrounds.updateOne({ playgroundId: playgroundId, "members.doodleId": doodleId }, { $set: { "members.$.score": score, "members.$.totalScore": newScore } });
            const playgroundUpdated = await Playgrounds.findOne({ playgroundId: playgroundId });
            return res.status(200).json({ status: true, guessed: true, msg: "Message added", playgroundDetails: playgroundUpdated, score: score, totalScore: newScore });
        }
        else {
            await Playgrounds.updateOne({ playgroundId: playgroundId }, { $push: { messages: { from: username, message: message } } });
            return res.status(200).json({ status: true, guessed: false, msg: "Message added" });
        }
    }
    catch (ex) {
        next(ex);
    }
};

//clear message request handler
module.exports.clearMessage = async (req, res, next) => {
    try {
        const { playgroundId, doodleId } = req.body;
        const token = req.cookies.token;
        const playground = await Playgrounds.findOne({ playgroundId: playgroundId });
        if (!playground)
            return res.status(200).json({ status: false, msg: "Playground does not exist" });
        if (await isValidRequest(doodleId, token) === false)
            return res.status(200).json({ status: false, msg: "Request not processed" });
        if (doodleId !== playground.owner) {
            return res.status(200).json({ status: false, msg: "You are not admin" });
        }
        await Playgrounds.updateOne({ playgroundId: playgroundId }, { $set: { messages: [] } });
        return res.status(200).json({ status: true, msg: "Chat cleared" });
    }
    catch (ex) {
        next(ex);
    }
};

// game manager request handler
module.exports.gameManager = async (req, res, next) => {
    try {
        const { playgroundId, doodleId } = req.body;
        const token = req.cookies.token;
        const playground = await Playgrounds.findOne({ playgroundId: playgroundId });
        if (!playground)
            return res.status(200).json({ status: false, msg: "Playground does not exist" });
        if (await isValidRequest(doodleId, token) === false)
            return res.status(200).json({ status: false, msg: "Request not processed" });
        if (playground.members.length < 2)
            return res.status(200).json({ status: false, msg: "Add atleast one more member to start the game" });
        if (playground.owner !== doodleId || playground.members.filter(element => element.doodleId === doodleId)[0].active === false)
            return res.status(200).json({ status: false, msg: "Check your network connection" });
        await Playgrounds.updateOne({ playgroundId: playgroundId }, { $set: { gameInProgress: true }, $inc: { roundPlayed: 1 } });
        return res.status(200).json({ status: true, msg: "Game started" });
    }
    catch (ex) {
        next(ex);
    }
};
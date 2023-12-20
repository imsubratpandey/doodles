const { Users, Sessions } = require("../collections/mongoCollections");
const bcrypt = require("bcrypt");
const { randomUUID } = require("crypto");
const jwt = require("jsonwebtoken");

//register post request handler
module.exports.register = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;
        const emailCheck = await Users.findOne({ email: email });
        if (emailCheck)
            return res.status(200).json({ status: false, msg: "Email already used" });
        const hashedPassword = await bcrypt.hash(password, 10);
        const doodleId = randomUUID();
        await Users.insertOne({ doodleId: doodleId, email: email, username: username, password: hashedPassword });
        const user = await Users.findOne({ username: username });
        delete user.password;
        const tokenId = randomUUID();
        const token = jwt.sign(
            { "tokenId": tokenId },
            process.env.TOKEN_SECRET_KEY,
            { expiresIn: "1d" }
        );
        await Sessions.insertOne({ doodleId: doodleId, tokenId: tokenId, email: email, username: username });
        res.cookie("token", token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
        return res.status(200).json({ status: true, user: user });
    }
    catch (ex) {
        next(ex);
    }
};

// login post request handler
module.exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await Users.findOne({ email: email });
        if (!user)
            return res.status(200).json({ status: false, msg: "Incorrect Email or Password" });
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid)
            return res.status(200).json({ status: false, msg: "Incorrect Email or Password" });
        delete user.password;
        const tokenId = randomUUID();
        const token = jwt.sign(
            { "tokenId": tokenId },
            process.env.TOKEN_SECRET_KEY,
            { expiresIn: "1d" }
        );
        await Sessions.insertOne({ doodleId: user.doodleId, tokenId: tokenId, email: email, username: user.username });
        res.cookie("token", token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
        return res.status(200).json({ status: true, user: user });
    } catch (ex) {
        next(ex);
    }
};

// logout post request handler
module.exports.logout = async (req, res, next) => {
    try {
        const { doodleId } = req.body;
        const token = req.cookies.token;
        const user = await Users.findOne({ doodleId: doodleId });
        if (!user)
            return res.status(200).json({ status: false });
        let tokenId, isVerificationDone = false;
        jwt.verify(
            token,
            process.env.TOKEN_SECRET_KEY,
            (err, decoded) => {
                if (err) {
                    isVerificationDone = true;
                    return res.status(200).json({ status: false });
                }
                tokenId = decoded.tokenId;
            }
        );
        if (isVerificationDone)
            return;
        const session = await Sessions.findOne({ tokenId: tokenId });
        if (!session)
            return res.status(200).json({ status: false });
        if (session.doodleId !== doodleId)
            return res.status(200).json({ status: false });
        await Sessions.remove({ tokenId: tokenId });
        return res.status(200).json({ status: true });
    } catch (ex) {
        next(ex);
    }
};


//user validation post request handler
module.exports.userValidation = async (req, res, next) => {
    try {
        const { doodleId } = req.body;
        const token = req.cookies.token;
        const user = await Users.findOne({ doodleId: doodleId });
        if (!user)
            return res.status(200).json({ isDoodleUser: false, isTokenValid: false });
        let tokenId, isVerificationDone = false;
        jwt.verify(
            token,
            process.env.TOKEN_SECRET_KEY,
            (err, decoded) => {
                if (err) {
                    isVerificationDone = true;
                    return res.status(200).json({ isDoodleUser: true, isTokenValid: false });
                }
                tokenId = decoded.tokenId;
            }
        );
        if (isVerificationDone)
            return;
        const session = await Sessions.findOne({ tokenId: tokenId });
        if (!session)
            return res.status(200).json({ isDoodleUser: true, isTokenValid: false });
        if (session.doodleId !== doodleId)
            return res.status(200).json({ isDoodleUser: true, isTokenValid: false });
        return res.status(200).json({ isDoodleUser: true, isTokenValid: true });
    } catch (ex) {
        next(ex);
    }
};
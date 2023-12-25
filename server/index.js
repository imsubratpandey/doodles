const express = require("express");
const socket = require("socket.io");
const app = express();
const userRoutes = require("./routes/userRoutes");
const playgroundRoutes = require("./routes/playgroundRoutes");
const { Playgrounds } = require("./collections/mongoCollections");
const cookieParser = require("cookie-parser");
require("dotenv").config();

app.use(express.json());
app.use(cookieParser());
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Credentials', true);
    res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
    res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Authorization, authorization, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
    next();
});

app.use("/auth", userRoutes);
app.use("/playground", playgroundRoutes);

const server = app.listen(process.env.PORT, () =>
    console.log(`Server started on port ${process.env.PORT}`)
);

//socket io part
const io = socket(server, {
    cors: {
        origin: "http://localhost:3000",
        credentials: true
    }
});

global.onlineUsers = new Map();
global.onlineId = new Map();
global.socketIdToPlayground = new Map();
global.temporaryUsers = new Map();
global.temporaryUsersId = new Map();
global.playgroundWords = new Map();
io.on("connection", (socket) => {
    global.chatSocket = socket;
    socket.on("in-playground", async (payload) => {
        const playground = await Playgrounds.findOne({ playgroundId: payload.playgroundId });
        if (!playground)
            return;
        await Playgrounds.updateOne({ playgroundId: payload.playgroundId, "members.doodleId": payload.doodleId }, { $set: { "members.$[].active": true } });
        onlineUsers.set(`${payload.doodleId}+${payload.playgroundId}`, socket.id);
        onlineId.set(socket.id, `${payload.doodleId}+${payload.playgroundId}`);
        socketIdToPlayground.set(socket.id, `${payload.owner}+${payload.playgroundId}`);
        await socket.join(`${payload.owner}+${payload.playgroundId}`);
        socket.to(`${payload.owner}+${payload.playgroundId}`).emit(
            "playground-update");
    });

    socket.on("send-playground-request", async (payload) => {
        temporaryUsers.set(`${payload.doodleId}+${payload.playgroundId}`, socket.id);
        temporaryUsersId.set(socket.id, `${payload.doodleId}+${payload.playgroundId}`);
        const playground = await Playgrounds.findOne({ playgroundId: payload.playgroundId });
        if (!playground)
            return;
        socket.to(onlineUsers.get(`${playground.owner}+${payload.playgroundId}`)).emit(
            "recieve-playground-request", payload);
    });

    socket.on("approve-playground-request", async (payload) => {
        await Playgrounds.updateOne({ playgroundId: payload.playgroundId }, { $push: { members: { doodleId: payload.doodleId, username: payload.username, score: 0, totalScore: 0 } } });
        socket.to(temporaryUsers.get(`${payload.doodleId}+${payload.playgroundId}`)).emit(
            "playground-request-approved", payload);
    });

    socket.on("disconnect", async () => {
        const Id = onlineId.get(socket.id);
        if (Id) {
            const Ids = Id.split('+');
            const doodleId = Ids[0], playgroundId = Ids[1];
            const playground = await Playgrounds.findOne({ playgroundId: playgroundId });
            if (playground) {
                await Playgrounds.updateOne({ playgroundId: playgroundId, "members.doodleId": doodleId }, { $set: { "members.$.active": false } });
            }
        }
        onlineId.delete(socket.id);
        onlineUsers.delete(Id);
        const tempId = temporaryUsersId.get(socket.id);
        temporaryUsersId.delete(socket.id);
        temporaryUsers.delete(tempId);
        socket.to(socketIdToPlayground.get(socket.id)).emit(
            "playground-update");
        socketIdToPlayground.delete(socket.id);
    });

    socket.on("send-game-started", async (payload) => {
        const playground = await Playgrounds.findOne({ playgroundId: payload.playgroundId });
        if (!playground)
            return;
        await Playgrounds.updateOne({ playgroundId: payload.playgroundId }, { $set: { gameInProgress: true } });
        await socket.to(`${payload.owner}+${payload.playgroundId}`).emit(
            "recieve-game-started");
        await new Promise(res => setTimeout(res, 5000));
        for (i = 0; i < payload.members.length; i++) {
            const playground = await Playgrounds.findOne({ playgroundId: payload.playgroundId });
            if (playground.members[i].active === false) {
                continue;
            }
            const drawerWords = ["apple", "phone", "robot"];
            playgroundWords.set(payload.playgroundId, drawerWords[0]);
            await socket.nsp.to(`${payload.owner}+${payload.playgroundId}`).emit(
                "recieve-choose-a-word", { drawer: playground.members[i], drawerWords: drawerWords });
            await new Promise(res => setTimeout(res, 5000));
            const date = new Date();
            await Playgrounds.updateOne({ playgroundId: payload.playgroundId }, { $set: { drawerWord: playgroundWords.get(payload.playgroundId), canvasEnableTime: [date.getHours(), date.getMinutes(), date.getSeconds()] } });
            await socket.nsp.to(`${payload.owner}+${payload.playgroundId}`).emit(
                "recieve-canvas-enable", { drawer: playground.members[i], drawerWord: playgroundWords.get(payload.playgroundId) });
            await new Promise(res => setTimeout(res, 30000));
        }
        await Playgrounds.updateOne({ playgroundId: payload.playgroundId }, { $set: { "members.$[].score": 0 } });
        await socket.nsp.to(`${payload.owner}+${payload.playgroundId}`).emit(
            "recieve-game-ended", { drawer: playground.members[i], drawerWord: playgroundWords.get(payload.playgroundId) });
        await Playgrounds.updateOne({ playgroundId: payload.playgroundId }, { $set: { gameInProgress: false, "members.$[].score": 0, drawerWord: "" } });
    });

    socket.on("send-set-word", async (payload) => {
        playgroundWords.set(payload.playgroundId, payload.drawerWord);
    });

    socket.on("send-start-drawing", async (payload) => {
        socket.to(`${payload.owner}+${payload.playgroundId}`).emit(
            "recieve-start-drawing", payload);
    });

    socket.on("send-end-drawing", async (payload) => {
        socket.to(`${payload.owner}+${payload.playgroundId}`).emit(
            "recieve-end-drawing", payload);
    });

    socket.on("send-draw", async (payload) => {
        socket.to(`${payload.owner}+${payload.playgroundId}`).emit(
            "recieve-draw", payload);
    });

    socket.on("send-flood-fill", async (payload) => {
        socket.to(`${payload.owner}+${payload.playgroundId}`).emit(
            "recieve-flood-fill", payload);
    });

    socket.on("send-message", async (payload) => {
        socket.to(`${payload.owner}+${payload.playgroundId}`).emit(
            "recieve-message", payload);
    });
});
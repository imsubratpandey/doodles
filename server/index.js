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
io.on("connection", (socket) => {
    global.chatSocket = socket;
    console.log(socket.id);
    socket.on("in-playground", async (payload) => {
        onlineUsers.set(`${payload.doodleId}+${payload.playgroundDetails.playgroundId}`, socket.id);
        onlineId.set(socket.id, `${payload.doodleId}+${payload.playgroundDetails.playgroundId}`);
        socketIdToPlayground.set(socket.id, `${payload.playgroundDetails.owner}+${payload.playgroundDetails.playgroundId}`);
        await socket.join(`${payload.playgroundDetails.owner}+${payload.playgroundDetails.playgroundId}`);
        socket.to(`${payload.playgroundDetails.owner}+${payload.playgroundDetails.playgroundId}`).emit(
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
        await Playgrounds.updateOne({ playgroundId: payload.playgroundId }, { $push: { members: { doodleId: payload.doodleId, username: payload.username } } });
        socket.to(temporaryUsers.get(`${payload.doodleId}+${payload.playgroundId}`)).emit(
            "playground-request-approved", payload);
    });
});
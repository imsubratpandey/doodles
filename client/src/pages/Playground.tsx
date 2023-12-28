import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { Socket, io } from "socket.io-client";
import { host, userValidationRoute, playgroundValidationRoute, playgroundDetailsRoute } from "../utils/APIRoutes";
import axios from "axios";
import Canvas from "../components/Canvas";
import Members from "../components/Members";
import ChatBox from "../components/ChatBox";
import DrawingTools from "../components/DrawingTools";
import "../css/Playground.css";
import Manager from '../components/Manager';

export default function Playground() {
    const socket = useRef<Socket>();
    const navigate = useNavigate();
    const { playgroundId } = useParams();
    const drawingCanvasBoxRef = useRef<any>(null);
    const [showPlaygroundLoadingWindow, setShowPlaygroundLoadingWindow] = useState(true);
    const [showPlaygroundLoadingButtons, setShowPlaygroundLoadingButtons] = useState(false);
    const [playgroundLoadingWindowMessage, setPlaygroundLoadingWindowMessage] = useState("");
    const [accessToPlayground, setAccessToPlayground] = useState(false);
    const [playgroundDetails, setPlaygroundDetails] = useState<{ members: { doodleId: string, name: string }[] }>();
    const [playgroundMessages, setPlaygroundMessages] = useState<{ from: string, message: string }[]>([]);
    const [selectedTool, setSelectedTool] = useState<string>("freehand");
    const [drawingCanvasBoxDimension, setDrawingCanvasBoxDimension] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
    const [lineWidth, setLineWidth] = useState<number>(5);
    const [lineColor, setLineColor] = useState<string>("#455d7a");
    const [lineOpacity, setLineOpacity] = useState<number>(1);
    const [inGame, setInGame] = useState<boolean>(false);
    const [displayMessage, setDisplayMessage] = useState<string>("");
    const [drawerWords, setDrawerWords] = useState<string[]>([]);
    const [drawerWord, setDrawerWord] = useState<string>("");
    const [drawer, setDrawer] = useState<any>();
    const [canDraw, setCanDraw] = useState<boolean>(false);
    const [showCanvas, setShowCanvas] = useState<boolean>(false);
    const [countdown, setCountdown] = useState<number>(0);
    useEffect(() => {
        setDrawingCanvasBoxDimension({ width: drawingCanvasBoxRef.current?.offsetWidth, height: drawingCanvasBoxRef.current?.offsetHeight });
    }, [showPlaygroundLoadingWindow, drawingCanvasBoxRef]);
    useEffect(() => {
        async function fetchData() {
            if (countdown) {
                await new Promise(res => setTimeout(res, 1000));
                setCountdown(countdown - 1);
            }
        }
        fetchData();
    }, [countdown, setCountdown]);
    useEffect(() => {
        async function fetchData() {
            if (accessToPlayground) {
                const user = await JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY as string) as any);
                const { data } = await axios.post(playgroundDetailsRoute, { doodleId: user.doodleId, playgroundId: playgroundId }, { withCredentials: true });
                if (data.status === true) {
                    setPlaygroundDetails(data.playgroundDetails);
                    setPlaygroundMessages(data.playgroundDetails.messages);
                    setInGame(data.playgroundDetails.gameInProgress);
                    socket.current = io(host);
                    socket.current.emit("in-playground", { owner: data.playgroundDetails.owner, playgroundId: data.playgroundDetails.playgroundId, doodleId: user.doodleId });
                    socket.current.on("playground-update", async () => {
                        const { data } = await axios.post(`${playgroundDetailsRoute}`, { playgroundId: playgroundId, doodleId: user.doodleId, username: user.username }, { withCredentials: true });
                        if (data.status === true)
                            setPlaygroundDetails(data.playgroundDetails);
                    });
                    socket.current.on("recieve-playground-request", async (payload) => {
                        toast(
                            <div className="acceptRejectOptions">
                                <div className="acceptRejectOptionsTitle">
                                    Incoming Request: {payload.username} !
                                </div>
                                <div>
                                    <button className="accept" onClick={async () => {
                                        socket.current?.emit("approve-playground-request", payload);
                                    }
                                    }>Accept</button>
                                    <button className="reject">Reject</button>
                                </div>
                            </div>);
                    });
                    socket.current.on("recieve-canvas-enable", async (payload) => {
                        setCanDraw(false);
                        setShowCanvas(true);
                        setDrawerWords([]);
                        setDisplayMessage("");
                        setCountdown(120);
                        if (payload.drawer.doodleId === user.doodleId) {
                            setDrawerWord(payload.drawerWord);
                            setCanDraw(true);
                        }
                    })
                    setShowPlaygroundLoadingWindow(false);
                }
                else {
                    toast.error(data.msg);
                }
            }
        }
        fetchData();
    }, [playgroundId, accessToPlayground]);
    useEffect(() => {
        async function fetchData() {
            if (localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY as string)) {
                const user = await JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY as string) as any);
                try {
                    const { data } = await axios.post(userValidationRoute, { doodleId: user.doodleId }, { withCredentials: true });
                    if (data.isDoodleUser === false || data.isTokenValid === false) {
                        if (!navigate) return;
                        navigate("/login");
                    }
                    else {
                        const { data } = await axios.post(playgroundValidationRoute, { doodleId: user.doodleId, playgroundId: playgroundId }, { withCredentials: true });
                        if (data.status === true && data.validated === true) {
                            setAccessToPlayground(true);
                        }
                        else if (data.status === true && data.validated === false) {
                            setPlaygroundLoadingWindowMessage("Waiting for the host to let you in !!!");
                            socket.current = io(host);
                            socket.current.on("playground-request-approved", async () => {
                                setAccessToPlayground(true);
                            });
                            socket.current.emit("send-playground-request", { doodleId: user.doodleId, playgroundId: playgroundId, username: user.username });
                            await new Promise(res => setTimeout(res, 6000));
                            setPlaygroundLoadingWindowMessage("Request could not approved");
                            setShowPlaygroundLoadingButtons(true);
                        }
                        else {
                            setPlaygroundLoadingWindowMessage("Redirecting to home");
                            toast.error(data.msg);
                        }
                    }
                } catch (err) {
                    console.log(err);
                }
            }
            else {
                if (!navigate) return;
                navigate("/login");
            }
        }
        fetchData();
    }, [playgroundId, navigate]);
    return (
        <>
            <div id={(showPlaygroundLoadingWindow === true) ? "playgroundLoadingWindowFlex" : "playgroundLoadingWindowNone"}>
                {
                    (playgroundLoadingWindowMessage.length === 0) ?
                        <>
                            <svg className="containerCircleLoadingAnimation" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                                <circle className="trackCircleLoadingAnimation" cx="20" cy="20" r="17.5" fill="none" strokeWidth="5px" pathLength="100" />
                                <circle className="carCircleLoadingAnimation" cx="20" cy="20" r="17.5" fill="none" strokeWidth="5px" pathLength="100" />
                            </svg>
                        </>
                        :
                        <>
                            <div id="playgroundLoadingWindowMessageContainer">
                                {playgroundLoadingWindowMessage}
                            </div>
                            {
                                (showPlaygroundLoadingButtons === true) ?
                                    <>
                                        <div id="playgroundLoadingButtons">
                                            <button className="buttonGreen" onClick={() => window.location.reload()}>Try Again</button>
                                            <button className="buttonGreen" onClick={() => navigate("/")}>Go Home</button>
                                        </div>
                                    </>
                                    :
                                    <>
                                        <div id="containerCoverRequestLoadingAnimation">
                                            <div className="containerRequestLoadingAnimation">
                                                <div className="cubeRequestLoadingAnimation"><div className="cube__innerRequestLoadingAnimation"></div></div>
                                                <div className="cubeRequestLoadingAnimation"><div className="cube__innerRequestLoadingAnimation"></div></div>
                                                <div className="cubeRequestLoadingAnimation"><div className="cube__innerRequestLoadingAnimation"></div></div>
                                            </div>
                                        </div>

                                    </>
                            }
                        </>
                }
            </div>
            <div id={(showPlaygroundLoadingWindow === false) ? "playgroundContainerFlex" : "playgroundContainerNone"}>
                <div id="drawingBox" ref={drawingCanvasBoxRef}>
                    {
                        (showCanvas === true) ?
                            <>
                                {
                                    (canDraw === true) ?
                                        <>
                                            <div id="drawerTitleMessageContainer" className="preventSelect">
                                                Draw {drawerWord} !!!
                                            </div>
                                            <DrawingTools lineWidth={lineWidth} setLineWidth={setLineWidth} lineColor={lineColor} setLineColor={setLineColor} lineOpacity={lineOpacity} setLineOpacity={setLineOpacity} selectedTool={selectedTool} setSelectedTool={setSelectedTool} socketConnection={socket.current} playgroundDetails={playgroundDetails} />
                                        </>
                                        :
                                        <>
                                            <div id="drawerWordContainer" className="preventSelect">
                                                GUESS THIS
                                            </div>
                                            <div id="membersTitleMessageContainer" className="preventSelect">
                                                {drawer.username} is drawing
                                            </div>
                                        </>
                                }
                                <div id="timerContainer" className="preventSelect">
                                    {countdown}
                                </div>
                                <Canvas dimension={{ width: drawingCanvasBoxDimension.width, height: drawingCanvasBoxDimension.height }} lineWidth={lineWidth} setLineWidth={setLineWidth} lineColor={lineColor} setLineColor={setLineColor} lineOpacity={lineOpacity} setLineOpacity={setLineOpacity} canDraw={canDraw} selectedTool={selectedTool} socketConnection={socket.current} playgroundDetails={playgroundDetails} />

                            </>
                            :
                            <>
                                <Manager toast={toast} countdown={countdown} setCountdown={setCountdown} inGame={inGame} setInGame={setInGame} setShowCanvas={setShowCanvas} displayMessage={displayMessage} setDisplayMessage={setDisplayMessage} setDrawer={setDrawer} drawerWords={drawerWords} setDrawerWords={setDrawerWords} playgroundDetails={playgroundDetails} socketConnection={socket.current} />
                            </>
                    }
                </div>
                <div id="sideBar">
                    <div id="membersContainer">
                        <div id="membersTitleBox">
                            <p id="membersTitle">Members</p>
                            <svg id="membersSettingIcon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="10px" height="10px"><path d="M 9.6660156 2 L 9.1757812 4.5234375 C 8.3516137 4.8342536 7.5947862 5.2699307 6.9316406 5.8144531 L 4.5078125 4.9785156 L 2.171875 9.0214844 L 4.1132812 10.708984 C 4.0386488 11.16721 4 11.591845 4 12 C 4 12.408768 4.0398071 12.832626 4.1132812 13.291016 L 4.1132812 13.292969 L 2.171875 14.980469 L 4.5078125 19.021484 L 6.9296875 18.1875 C 7.5928951 18.732319 8.3514346 19.165567 9.1757812 19.476562 L 9.6660156 22 L 14.333984 22 L 14.824219 19.476562 C 15.648925 19.165543 16.404903 18.73057 17.068359 18.185547 L 19.492188 19.021484 L 21.826172 14.980469 L 19.886719 13.291016 C 19.961351 12.83279 20 12.408155 20 12 C 20 11.592457 19.96113 11.168374 19.886719 10.710938 L 19.886719 10.708984 L 21.828125 9.0195312 L 19.492188 4.9785156 L 17.070312 5.8125 C 16.407106 5.2676813 15.648565 4.8344327 14.824219 4.5234375 L 14.333984 2 L 9.6660156 2 z M 11.314453 4 L 12.685547 4 L 13.074219 6 L 14.117188 6.3945312 C 14.745852 6.63147 15.310672 6.9567546 15.800781 7.359375 L 16.664062 8.0664062 L 18.585938 7.40625 L 19.271484 8.5917969 L 17.736328 9.9277344 L 17.912109 11.027344 L 17.912109 11.029297 C 17.973258 11.404235 18 11.718768 18 12 C 18 12.281232 17.973259 12.595718 17.912109 12.970703 L 17.734375 14.070312 L 19.269531 15.40625 L 18.583984 16.59375 L 16.664062 15.931641 L 15.798828 16.640625 C 15.308719 17.043245 14.745852 17.36853 14.117188 17.605469 L 14.115234 17.605469 L 13.072266 18 L 12.683594 20 L 11.314453 20 L 10.925781 18 L 9.8828125 17.605469 C 9.2541467 17.36853 8.6893282 17.043245 8.1992188 16.640625 L 7.3359375 15.933594 L 5.4140625 16.59375 L 4.7285156 15.408203 L 6.265625 14.070312 L 6.0878906 12.974609 L 6.0878906 12.972656 C 6.0276183 12.596088 6 12.280673 6 12 C 6 11.718768 6.026742 11.404282 6.0878906 11.029297 L 6.265625 9.9296875 L 4.7285156 8.59375 L 5.4140625 7.40625 L 7.3359375 8.0683594 L 8.1992188 7.359375 C 8.6893282 6.9567546 9.2541467 6.6314701 9.8828125 6.3945312 L 10.925781 6 L 11.314453 4 z M 12 8 C 9.8034768 8 8 9.8034768 8 12 C 8 14.196523 9.8034768 16 12 16 C 14.196523 16 16 14.196523 16 12 C 16 9.8034768 14.196523 8 12 8 z M 12 10 C 13.111477 10 14 10.888523 14 12 C 14 13.111477 13.111477 14 12 14 C 10.888523 14 10 13.111477 10 12 C 10 10.888523 10.888523 10 12 10 z" /></svg>
                        </div>
                        <Members playgroundDetails={playgroundDetails} />
                    </div>
                    <div id="chatContainer">
                        <div id="chatTitleBox">
                            <p id="chatTitle">Chats</p>
                            <svg id="chatSettingIcon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="10px" height="10px"><path d="M 9.6660156 2 L 9.1757812 4.5234375 C 8.3516137 4.8342536 7.5947862 5.2699307 6.9316406 5.8144531 L 4.5078125 4.9785156 L 2.171875 9.0214844 L 4.1132812 10.708984 C 4.0386488 11.16721 4 11.591845 4 12 C 4 12.408768 4.0398071 12.832626 4.1132812 13.291016 L 4.1132812 13.292969 L 2.171875 14.980469 L 4.5078125 19.021484 L 6.9296875 18.1875 C 7.5928951 18.732319 8.3514346 19.165567 9.1757812 19.476562 L 9.6660156 22 L 14.333984 22 L 14.824219 19.476562 C 15.648925 19.165543 16.404903 18.73057 17.068359 18.185547 L 19.492188 19.021484 L 21.826172 14.980469 L 19.886719 13.291016 C 19.961351 12.83279 20 12.408155 20 12 C 20 11.592457 19.96113 11.168374 19.886719 10.710938 L 19.886719 10.708984 L 21.828125 9.0195312 L 19.492188 4.9785156 L 17.070312 5.8125 C 16.407106 5.2676813 15.648565 4.8344327 14.824219 4.5234375 L 14.333984 2 L 9.6660156 2 z M 11.314453 4 L 12.685547 4 L 13.074219 6 L 14.117188 6.3945312 C 14.745852 6.63147 15.310672 6.9567546 15.800781 7.359375 L 16.664062 8.0664062 L 18.585938 7.40625 L 19.271484 8.5917969 L 17.736328 9.9277344 L 17.912109 11.027344 L 17.912109 11.029297 C 17.973258 11.404235 18 11.718768 18 12 C 18 12.281232 17.973259 12.595718 17.912109 12.970703 L 17.734375 14.070312 L 19.269531 15.40625 L 18.583984 16.59375 L 16.664062 15.931641 L 15.798828 16.640625 C 15.308719 17.043245 14.745852 17.36853 14.117188 17.605469 L 14.115234 17.605469 L 13.072266 18 L 12.683594 20 L 11.314453 20 L 10.925781 18 L 9.8828125 17.605469 C 9.2541467 17.36853 8.6893282 17.043245 8.1992188 16.640625 L 7.3359375 15.933594 L 5.4140625 16.59375 L 4.7285156 15.408203 L 6.265625 14.070312 L 6.0878906 12.974609 L 6.0878906 12.972656 C 6.0276183 12.596088 6 12.280673 6 12 C 6 11.718768 6.026742 11.404282 6.0878906 11.029297 L 6.265625 9.9296875 L 4.7285156 8.59375 L 5.4140625 7.40625 L 7.3359375 8.0683594 L 8.1992188 7.359375 C 8.6893282 6.9567546 9.2541467 6.6314701 9.8828125 6.3945312 L 10.925781 6 L 11.314453 4 z M 12 8 C 9.8034768 8 8 9.8034768 8 12 C 8 14.196523 9.8034768 16 12 16 C 14.196523 16 16 14.196523 16 12 C 16 9.8034768 14.196523 8 12 8 z M 12 10 C 13.111477 10 14 10.888523 14 12 C 14 13.111477 13.111477 14 12 14 C 10.888523 14 10 13.111477 10 12 C 10 10.888523 10.888523 10 12 10 z" /></svg>
                        </div>
                        <ChatBox drawerDoodleId={drawer?.doodleId} members={playgroundDetails?.members} playgroundMessages={playgroundMessages} setPlaygroundMessages={setPlaygroundMessages} playgroundDetails={playgroundDetails} setPlaygroundDetails={setPlaygroundDetails} socketConnection={socket.current} />
                    </div>
                </div>
            </div>
            <ToastContainer style={{ backgroundColor: "rgba(0, 0, 0, 0)", overflow: "hidden" }} toastStyle={{ backgroundColor: "#1b1b1b" }} newestOnTop />
        </>
    )
}

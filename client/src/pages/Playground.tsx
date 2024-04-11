import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { Flip, ToastContainer, toast } from "react-toastify";
import { Socket, io } from "socket.io-client";
import { host, userValidationRoute, playgroundValidationRoute, playgroundDetailsRoute, clearChatRoute } from "../utils/APIRoutes";
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
    const toastOptions: any = {
        position: "bottom-left",
        autoClose: 5000,
        transition: Flip,
        hideProgressBar: true,
        pauseOnHover: false,
        pauseOnFocusLoss: false,
        draggable: false,
        closeButton: false,
        closeOnClick: false
    };
    const toastOptionsForRequest: any = {
        position: "bottom-left",
        autoClose: 5000,
        transition: Flip,
        hideProgressBar: false,
        pauseOnHover: false,
        pauseOnFocusLoss: false,
        draggable: false,
        closeButton: false
    };
    const { playgroundId } = useParams();
    const drawingCanvasBoxRef = useRef<any>(null);
    const [showPlaygroundLoadingWindow, setShowPlaygroundLoadingWindow] = useState(true);
    const [showPlaygroundLoadingButtons, setShowPlaygroundLoadingButtons] = useState(false);
    const [playgroundLoadingWindowMessage, setPlaygroundLoadingWindowMessage] = useState("");
    const [accessToPlayground, setAccessToPlayground] = useState(false);
    const [playgroundDetails, setPlaygroundDetails] = useState<any>();
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
    const [roundPlayed, setRoundPlayed] = useState<number>(0);
    const [isChatContainerVisible, setIsChatContainerVisible] = useState<boolean>(true);
    const [rankingsData, setRankingsData] = useState<any>([]);
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
            const toastOptions: any = {
                position: "bottom-left",
                autoClose: 5000,
                transition: Flip,
                hideProgressBar: true,
                pauseOnHover: false,
                pauseOnFocusLoss: false,
                draggable: false,
                closeButton: false,
                closeOnClick: false
            };
            const toastOptionsForRequest: any = {
                position: "bottom-left",
                autoClose: 5000,
                transition: Flip,
                hideProgressBar: false,
                pauseOnHover: false,
                pauseOnFocusLoss: false,
                draggable: false,
                closeButton: false
            };
            if (accessToPlayground) {
                const user = await JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY as string) as any);
                const { data } = await axios.post(playgroundDetailsRoute, { doodleId: user.doodleId, playgroundId: playgroundId }, { withCredentials: true });
                if (data.status === true) {
                    setPlaygroundDetails(data.playgroundDetails);
                    setPlaygroundMessages(data.playgroundDetails.messages);
                    setRoundPlayed(data.playgroundDetails.roundPlayed);
                    setRankingsData(data.playgroundDetails.rankingsData);
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
                            </div>, toastOptionsForRequest);
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
                    });
                    socket.current.on("recieve-clear-chat", () => {
                        toast.info("Chat cleared by admin", toastOptions);
                        setIsChatContainerVisible(false);
                        setPlaygroundMessages([]);
                        setIsChatContainerVisible(true);
                        setShowPlaygroundLoadingWindow(false);
                    });
                    socket.current.on("recieve-clear-chat-request", async (payload) => {
                        toast.info(`${payload.username} requested to clear chat`, toastOptions);
                    });
                    setShowPlaygroundLoadingWindow(false);
                }
                else {
                    toast.error(data.msg, toastOptions);
                }
            }
        }
        fetchData();
    }, [playgroundId, accessToPlayground]);
    useEffect(() => {
        async function fetchData() {
            const toastOptions: any = {
                position: "bottom-left",
                autoClose: 5000,
                transition: Flip,
                hideProgressBar: true,
                pauseOnHover: false,
                pauseOnFocusLoss: false,
                draggable: false,
                closeButton: false,
                closeOnClick: false
            };
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
                            toast.error(data.msg, toastOptions);
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
    const exitPlayground = () => {
        setShowPlaygroundLoadingWindow(true);
        navigate("/");
        window.location.reload();
    };
    const clearChat = async () => {
        if (socket.current) {
            const user = await JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY as string) as any);
            try {
                const { data } = await axios.post(clearChatRoute, { owner: playgroundDetails.owner, playgroundId: playgroundDetails.playgroundId, doodleId: user.doodleId }, { withCredentials: true });
                if (data.status === true) {
                    setPlaygroundMessages([]);
                    setIsChatContainerVisible(true);
                    toast.info("Chat cleared", toastOptions);
                    socket.current.emit("send-clear-chat", { owner: playgroundDetails.owner, playgroundId: playgroundDetails.playgroundId });
                }
                else {
                    toast.error(data.msg, toastOptions);
                }

            } catch (err) {
                console.log(err);
            }
        }
    };
    const clearChatActions = async () => {
        if (socket.current) {
            const user = await JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY as string) as any);
            if (playgroundDetails.owner === user.doodleId && playgroundMessages.length !== 0) {
                toast(
                    <div className="acceptRejectOptions">
                        <div className="acceptRejectOptionsTitle">
                            Really want to clear chat?
                        </div>
                        <div>
                            <button className="accept" onClick={async () => {
                                clearChat();
                            }
                            }>Clear</button>
                            <button className="reject">Cancel</button>
                        </div>
                    </div>, toastOptionsForRequest);
            }

            else if (playgroundMessages.length === 0) {
                toast.error("No chat to clear", toastOptions);
            }
            else {
                socket.current.emit("send-clear-chat-request", { owner: playgroundDetails.owner, playgroundId: playgroundDetails.playgroundId, username: user.username });
                toast.error("Request sent to admin", toastOptions);
            }
        }
    };
    const clearExitActions = async () => {
        toast(
            <div className="acceptRejectOptions">
                <div className="acceptRejectOptionsTitle">
                    Really want to leave playground?
                </div>
                <div>
                    <button className="accept" onClick={async () => {
                        exitPlayground();
                    }
                    }>Leave</button>
                    <button className="reject">Cancel</button>
                </div>
            </div>, toastOptionsForRequest);
    };
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
                                            <button className="buttonGreen" onClick={() => { window.location.reload(); }}>Try Again</button>
                                            <button className="buttonGreen" onClick={() => { navigate("/"); }}>Go Home</button>
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
                <div id={(canDraw === false) ? "drawingBox" : "drawingBoxFull"} ref={drawingCanvasBoxRef}>
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
                                <Manager toast={toast} toastOptions={toastOptions} countdown={countdown} setCountdown={setCountdown} rankingsData={rankingsData} setRankingsData={setRankingsData} roundPlayed={roundPlayed} setRoundPlayed={setRoundPlayed} inGame={inGame} setInGame={setInGame} setShowCanvas={setShowCanvas} displayMessage={displayMessage} setDisplayMessage={setDisplayMessage} setDrawer={setDrawer} drawerWords={drawerWords} setDrawerWords={setDrawerWords} playgroundDetails={playgroundDetails} socketConnection={socket.current} />
                            </>
                    }
                </div>
                <div id="sideBar">
                    <div id="membersContainer">
                        <div id="membersTitleBox" className="preventSelect">
                            <p id="membersTitle">Members</p>
                            <svg id="membersSettingIcon" onClick={() => { clearExitActions(); }} viewBox="34.9764 96.647 396.2632 396.2328" version="1.1" xmlns="http://www.w3.org/2000/svg">
                                <path fill="#455d7a" opacity="1.000000" stroke="none" d="M 222.602 487.313 C 216.802 491.498 210.482 492.808 203.888 492.815 C 164.394 492.858 124.898 492.96 85.404 492.762 C 56.403 492.617 35.145 471.533 35.095 442.445 C 34.924 343.957 34.951 245.47 35.093 146.982 C 35.129 122.075 50.573 102.855 73.92 97.918 C 78.28 96.997 82.844 96.718 87.315 96.707 C 125.644 96.616 163.972 96.67 202.301 96.647 C 214.194 96.64 224.33 99.936 230.443 111.124 C 240.142 128.875 227.391 150.957 207.215 151.023 C 170.22 151.144 133.224 151.058 96.229 151.064 C 89.515 151.066 89.488 151.081 89.488 157.646 C 89.483 249.134 89.53 340.623 89.373 432.111 C 89.364 437.313 90.974 438.488 95.914 438.462 C 132.575 438.269 169.238 438.346 205.9 438.367 C 218.396 438.374 228.163 445.091 232.057 456.248 C 236.056 467.704 232.627 479.248 222.602 487.313 Z" />
                                <path fill="#455d7a" opacity="1.000000" stroke="none" d="M 307.046 181.231 C 318.575 177.58 328.192 180.503 336.248 188.517 C 364.836 216.959 393.401 245.426 421.777 274.08 C 434.542 286.969 434.32 302.897 421.548 315.672 C 393.039 344.187 364.472 372.644 335.85 401.046 C 324.379 412.43 307.863 412.698 296.938 401.926 C 285.907 391.05 286.053 374.024 297.412 362.552 C 308.902 350.949 320.523 339.474 332.052 327.908 C 333.543 326.412 335.367 325.153 336.23 322.96 C 333.297 321.591 330.273 322.041 327.334 322.039 C 276.842 322.009 226.35 322.041 175.857 321.996 C 161.475 321.983 149.972 312.774 147.82 299.793 C 144.881 282.056 157.306 267.426 175.497 267.411 C 225.99 267.368 276.482 267.409 326.974 267.392 C 329.593 267.391 332.307 267.797 334.803 266.37 C 335.18 263.606 332.944 262.531 331.533 261.106 C 320.398 249.854 309.165 238.699 298.002 227.474 C 282.646 212.031 286.757 190.225 307.046 181.231 Z" />
                            </svg>
                        </div>
                        <Members playgroundDetails={playgroundDetails} />
                    </div>
                    <div id="chatContainer">
                        {
                            (isChatContainerVisible === true) ?
                                <>
                                    <div id="chatTitleBox" className="preventSelect">
                                        <p id="chatTitle">Chats</p>
                                        <svg id="chatSettingIcon" onClick={() => { clearChatActions(); }} viewBox="157.9134 157.502 124.5668 146.7817" version="1.1" xmlns="http://www.w3.org/2000/svg">
                                            <path fill="#455d7a" opacity="1.000000" stroke="none" d="M 177.096 304.246 C 173.104 304.246 169.604 304.285 166.105 304.237 C 158.869 304.137 156.737 300.974 158.497 293.98 C 162.023 279.966 165.332 265.897 168.591 251.818 C 169.335 248.604 169.51 245.258 169.966 241.834 C 203.497 241.834 236.767 241.834 268.916 241.834 C 273.425 260.16 277.881 278.031 282.188 295.938 C 283.343 300.739 281.022 303.993 276.138 304.148 C 267.999 304.405 259.847 304.218 251.035 304.218 C 249.826 296.962 248.514 289.966 247.541 282.923 C 246.951 278.652 245.143 275.836 240.566 276.307 C 235.938 276.783 234.596 280.111 235.151 284.267 C 236.006 290.675 237.052 297.057 238.077 303.848 C 226.168 303.848 214.307 303.848 202.063 303.848 C 202.922 298.802 203.78 293.769 204.634 288.736 C 204.746 288.079 204.86 287.422 204.938 286.76 C 205.729 280.043 204.044 276.669 199.687 276.229 C 195.392 275.795 193.446 278.235 192.419 284.928 C 191.441 291.295 190.281 297.634 189.157 304.246 C 184.883 304.246 181.235 304.246 177.096 304.246 Z" />
                                            <path fill="#455d7a" opacity="1.000000" stroke="none" d="M 193.146 204.232 C 200.261 204.232 206.88 204.232 213.954 204.232 C 213.954 192.067 213.953 180.451 213.955 168.834 C 213.955 167.168 213.924 165.5 213.982 163.836 C 214.118 159.89 216.093 157.504 220.121 157.502 C 224.149 157.499 226.232 159.888 226.257 163.829 C 226.331 175.324 226.296 186.82 226.303 198.315 C 226.304 200.103 226.303 201.891 226.303 204.232 C 234.038 204.232 241.352 204.656 248.6 204.148 C 266.26 202.908 272.191 213.003 269.69 229.008 C 236.662 229.008 203.598 229.008 170.213 229.008 C 170.213 225.149 169.922 221.493 170.275 217.9 C 170.974 210.777 177.002 205.026 184.16 204.414 C 186.975 204.173 189.819 204.282 193.146 204.232 Z" />
                                        </svg>
                                    </div>
                                    <ChatBox drawerDoodleId={drawer?.doodleId} members={playgroundDetails?.members} playgroundMessages={playgroundMessages} setPlaygroundMessages={setPlaygroundMessages} playgroundDetails={playgroundDetails} setPlaygroundDetails={setPlaygroundDetails} socketConnection={socket.current} />
                                </>
                                :
                                <>
                                    <div id="chatLoader">
                                        <svg className="containerCircleLoadingAnimation" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                                            <circle className="trackCircleLoadingAnimation" cx="20" cy="20" r="17.5" fill="none" strokeWidth="5px" pathLength="100" />
                                            <circle className="carCircleLoadingAnimation" cx="20" cy="20" r="17.5" fill="none" strokeWidth="5px" pathLength="100" />
                                        </svg>
                                    </div>
                                </>
                        }
                    </div>
                </div>
            </div>
            <ToastContainer bodyClassName="toastBody" style={{ backgroundColor: "rgba(0, 0, 0, 0)", overflow: "hidden" }} toastStyle={{ backgroundColor: "#FFFF" }} newestOnTop />
        </>
    )
}

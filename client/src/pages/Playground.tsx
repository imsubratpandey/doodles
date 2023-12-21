import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { Socket, io } from "socket.io-client";
import { host, userValidationRoute, playgroundValidationRoute, playgroundDetailsRoute } from "../utils/APIRoutes";
import axios from "axios";
import "../css/Playground.css";

export default function Playground() {
    const socket = useRef<Socket>();
    const navigate = useNavigate();
    const { playgroundId } = useParams();
    const [showPlaygroundLoadingWindow, setShowPlaygroundLoadingWindow] = useState(true);
    const [showPlaygroundLoadingButtons, setShowPlaygroundLoadingButtons] = useState(false);
    const [playgroundLoadingWindowMessage, setPlaygroundLoadingWindowMessage] = useState("Loading");
    const [accessToPlayground, setAccessToPlayground] = useState(false);
    const [playgroundDetails, setPlaygroundDetails] = useState();
    const [playgroundMessages, setplaygroundMessages] = useState();
    useEffect(() => {
        async function fetchData() {
            if (accessToPlayground) {
                const user = await JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY as string) as any);
                const { data } = await axios.post(playgroundDetailsRoute, { doodleId: user.doodleId, playgroundId: playgroundId }, { withCredentials: true });
                if (data.status === true) {
                    setPlaygroundDetails(data.playgroundDetails);
                    setplaygroundMessages(data.playgroundDetails.messages);
                    socket.current = io(host);
                    socket.current?.emit("in-playground", { playgroundDetails: data.playgroundDetails, doodleId: user.doodleId });
                    socket.current?.on("playground-update", async () => {
                        const { data } = await axios.post(`${playgroundDetailsRoute}`, { playgroundId: playgroundId, doodleId: user.doodleId, username: user.username });
                        if (data.status === true)
                            setPlaygroundDetails(data.playgroundDetails);
                    });
                    socket.current?.on("recieve-playground-request", async (payload) => {
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
                            setPlaygroundLoadingWindowMessage("Authorizing");
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
                {playgroundLoadingWindowMessage}
                <div id={(showPlaygroundLoadingButtons === true) ? "playgroundLoadingButtonsFlex" : "playgroundLoadingButtonsNone"}>
                    <button onClick={() => window.location.reload()}>Try Again</button>
                    <button onClick={() => navigate("/")}>Cancel</button>
                </div>
            </div>
            <div id={(showPlaygroundLoadingWindow === false) ? "playgroundContainerFlex" : "playgroundContainerNone"}>
                Playground
            </div>
            <ToastContainer style={{ backgroundColor: "rgba(0, 0, 0, 0)", overflow: "hidden" }} toastStyle={{ backgroundColor: "#1b1b1b" }} newestOnTop />
        </>
    )
}

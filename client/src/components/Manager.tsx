import React, { useState, useEffect } from 'react';
import { gameManagerRoute } from "../utils/APIRoutes";
import axios from "axios";
import "../css/Manager.css";

interface Props {
    toast: any,
    countdown: number,
    setCountdown: any,
    inGame: boolean,
    setInGame: any,
    setShowCanvas: any,
    displayMessage: string,
    setDisplayMessage: any,
    setDrawer: any,
    drawerWords: string[],
    setDrawerWords: any,
    playgroundDetails: any,
    socketConnection: any
}

export default function Manager({ toast, countdown, setCountdown, inGame, setInGame, setShowCanvas, displayMessage, setDisplayMessage, setDrawer, drawerWords, setDrawerWords, playgroundDetails, socketConnection }: Props) {
    const [user, setUser] = useState<any>();
    const [drawerWordIndex, setdrawerWordIndex] = useState<number>();

    useEffect(() => {
        async function fetchData() {
            if (socketConnection) {
                const user = await JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY as string) as any);
                setUser(user);
                socketConnection.on("recieve-game-started", () => {
                    setInGame(true);
                });
                socketConnection.on("recieve-choose-a-word", async (payload: any) => {
                    if (payload.drawer.doodleId === user.doodleId) {
                        setCountdown(5);
                        setDrawerWords(payload.drawerWords);
                    }
                    setShowCanvas(false);
                    setDrawer(payload.drawer);
                    setDisplayMessage(`${payload.drawer.username} is choosing a word`);
                });
                socketConnection.on("recieve-game-ended", async (payload: any) => {
                    setDisplayMessage("");
                    setInGame(false);
                    setShowCanvas(false);
                });
            }
        }
        fetchData();
    }, [socketConnection, setInGame, setDisplayMessage, setDrawer, setCountdown, setDrawerWords, setShowCanvas]);
    const startGame = async () => {
        if (user) {
            const { data } = await axios.post(gameManagerRoute, { playgroundId: playgroundDetails.playgroundId, doodleId: user.doodleId }, { withCredentials: true });
            if (data.status === true) {
                const payload = { owner: playgroundDetails.owner, playgroundId: playgroundDetails.playgroundId, members: playgroundDetails.members };
                socketConnection.emit("send-game-started", payload);
                setInGame(true);
            }
            else {
                toast.error(data.msg);
            }
        }
    };
    const assignDrawerWord = async (i: number) => {
        setdrawerWordIndex(i);
        const payload = { playgroundId: playgroundDetails.playgroundId, drawerWord: drawerWords[i] }
        socketConnection.emit("send-set-word", payload);
    };
    return (
        <>
            <div id="managerContainer">
                {
                    (inGame === true) ?
                        <>
                            {
                                (drawerWords.length === 3) ?
                                    <>
                                        <div id="chooseWindow">
                                            <div id="chooseAWordTitle" className="preventSelect">
                                                <div>
                                                    {countdown}
                                                </div>
                                                <div>
                                                    Your turn, Choose a word !!!
                                                </div>
                                            </div>
                                            <div id="chooseAWordContent">
                                                {drawerWords.map((drawerWord: string, i: number) => {
                                                    return (
                                                        <button className={(drawerWordIndex === i) ? "choosedButton" : "wordChooseButtons"} onClick={() => assignDrawerWord(i)} key={i}>{drawerWords[i]}</button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </>
                                    :
                                    <>
                                        {
                                            (displayMessage.length === 0) ?
                                                <>
                                                    <svg className="containerCircleLoadingAnimation" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                                                        <circle className="trackCircleLoadingAnimation" cx="20" cy="20" r="17.5" fill="none" strokeWidth="5px" pathLength="100" />
                                                        <circle className="carCircleLoadingAnimation" cx="20" cy="20" r="17.5" fill="none" strokeWidth="5px" pathLength="100" />
                                                    </svg>
                                                </>
                                                :
                                                <>
                                                    <div id="membersDisplayMessage" className="preventSelect">
                                                        {displayMessage}
                                                    </div>
                                                </>
                                        }
                                    </>
                            }
                        </>
                        :
                        <>
                            <div id="welcomeMessageContainer" className="preventSelect">
                                Welcome to playground
                            </div>
                            {
                                (user?.doodleId === playgroundDetails?.owner) ?
                                    <>
                                        <div className="managerButtons">
                                            <button className="inviteButton">Copy Invite Link</button>
                                            <button className="inviteButton">Copy Ground Id</button>
                                            <button className="startButton" onClick={startGame}>Start Game</button>
                                        </div>

                                    </>
                                    :
                                    <>
                                        <div id="membersMessageContainer" className="preventSelect">
                                            Waiting for the admin to start the game !!!
                                        </div>
                                    </>
                            }
                        </>
                }
            </div>
        </>
    )
}

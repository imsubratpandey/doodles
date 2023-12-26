import React, { useState, useEffect } from 'react';
import { gameManagerRoute } from "../utils/APIRoutes";
import axios from "axios";
import "../css/Manager.css";

interface Props {
    toast: any,
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

export default function Manager({ toast, inGame, setInGame, setShowCanvas, displayMessage, setDisplayMessage, setDrawer, drawerWords, setDrawerWords, playgroundDetails, socketConnection }: Props) {
    const [user, setUser] = useState<any>();
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
                        setDrawerWords(payload.drawerWords);
                    }
                    setShowCanvas(false);
                    setDrawer(payload.drawer);
                    setDisplayMessage(`${payload.drawer.username} is choosing a word`);
                });
                socketConnection.on("recieve-game-ended", async (payload: any) => {
                    setDisplayMessage("Loading");
                    setInGame(false);
                    setShowCanvas(false);
                });
            }
        }
        fetchData();
    }, [socketConnection, setInGame, setDisplayMessage, setDrawer, setDrawerWords, setShowCanvas]);
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
    const setDrawerWord = async (i: number) => {
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
                                            <div id="chooseAWordTitle">
                                                Your turn, Choose a word !!!
                                            </div>
                                            <div id="chooseAWordContent">
                                                {drawerWords.map((drawerWord: string, i: number) => {
                                                    return (
                                                        <button onClick={() => setDrawerWord(i)} key={i}>{drawerWords[i]}</button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </>
                                    :
                                    <>
                                        {displayMessage}
                                    </>
                            }
                        </>
                        :
                        <>
                            <div id="welcomeMessageContainer">
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
                                        <div id="membersMessageContainer">
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

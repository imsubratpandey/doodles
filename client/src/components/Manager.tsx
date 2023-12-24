import React, { useState, useEffect } from 'react';
import { gameManagerRoute } from "../utils/APIRoutes";
import axios from "axios";
import "../css/Manager.css";

interface Props {
    toast: any,
    inGame: boolean,
    setInGame: any,
    displayMessage: string,
    setDisplayMessage: any,
    drawerWords: string[],
    setDrawerWords: any,
    playgroundDetails: any,
    socketConnection: any
}

export default function Manager({ toast, inGame, setInGame, displayMessage, setDisplayMessage, drawerWords, setDrawerWords, playgroundDetails, socketConnection }: Props) {
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
                    setDisplayMessage(`${payload.drawer.username} is choosing a word`);
                });
            }
        }
        fetchData();
    }, [socketConnection, setInGame, setDisplayMessage, setDrawerWords]);
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
                                        {
                                            (playgroundDetails?.members.length <= 1) ?
                                                <>
                                                    Add atleast one more member to start the game
                                                    <div className="managerButtons">
                                                        <button className="inviteButton">Copy Invite Link</button>
                                                        <button className="inviteButton">Copy Playground Id</button>
                                                    </div>
                                                </>
                                                :
                                                <>
                                                    Invite more members or start the game
                                                    <div className="managerButtons">
                                                        <button className="inviteButton">Copy Invite Link</button>
                                                        <button className="inviteButton">Copy Playground Id</button>
                                                        <button className="startButton" onClick={startGame}>Start</button>
                                                    </div>
                                                </>
                                        }
                                    </>
                                    :
                                    <>
                                        Waiting for the admin to start the game !!!
                                    </>
                            }
                        </>
                }
            </div>
        </>
    )
}

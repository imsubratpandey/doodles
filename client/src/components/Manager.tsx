import React, { useState, useEffect } from 'react';
import { gameManagerRoute } from "../utils/APIRoutes";
import Rankings from './Rankings';
import axios from "axios";
import "../css/Manager.css";

interface Props {
    toast: any,
    toastOptions: any,
    countdown: number,
    roundPlayed: number,
    rankingsData: any,
    setRankingsData: any,
    setRoundPlayed: any,
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

export default function Manager({ toast, toastOptions, rankingsData, setRankingsData, roundPlayed, setRoundPlayed, countdown, setCountdown, inGame, setInGame, setShowCanvas, displayMessage, setDisplayMessage, setDrawer, drawerWords, setDrawerWords, playgroundDetails, socketConnection }: Props) {
    const [user, setUser] = useState<any>();
    const [drawerWordIndex, setdrawerWordIndex] = useState<number>();
    const [isRankingVisible, setIsRankingVisible] = useState<boolean>(false);

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
                    setRankingsData(payload.rankingsData);
                    setDisplayMessage("");
                    setInGame(false);
                    setShowCanvas(false);
                });
            }
        }
        fetchData();
    }, [socketConnection, setInGame, setDisplayMessage, setRankingsData, setDrawer, setCountdown, setDrawerWords, setShowCanvas]);
    const startGame = async () => {
        if (user) {
            const { data } = await axios.post(gameManagerRoute, { playgroundId: playgroundDetails.playgroundId, doodleId: user.doodleId }, { withCredentials: true });
            if (data.status === true) {
                const payload = { owner: playgroundDetails.owner, playgroundId: playgroundDetails.playgroundId, members: playgroundDetails.members };
                socketConnection.emit("send-game-started", payload);
                setRoundPlayed(roundPlayed + 1);
                setInGame(true);
            }
            else {
                toast.error(data.msg, toastOptions);
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
                <div id="openRankingsBox" className="preventSelect" onClick={() => { setIsRankingVisible(!isRankingVisible); }}>
                    Rankings
                </div>
                {
                    (isRankingVisible === true) ?
                        <>
                            <Rankings rankingsData={rankingsData} setIsRankingVisible={setIsRankingVisible} />
                        </>
                        :
                        <>
                        </>
                }
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
                                {
                                    (rankingsData.length === 0) ?
                                        <>
                                            Welocme to playground
                                        </>
                                        :
                                        <>
                                            {
                                                (rankingsData[0].totalScore !== rankingsData[1].totalScore) ?
                                                    <>
                                                        {rankingsData[0].username} is winner
                                                    </>
                                                    :
                                                    <>
                                                        It's a tie
                                                    </>
                                            }
                                        </>
                                }
                            </div>
                            {
                                (user?.doodleId === playgroundDetails?.owner) ?
                                    <>
                                        <div className="managerButtons">
                                            <button className="inviteButton">Copy Invite Link</button>
                                            <button className="inviteButton">Copy Ground Id</button>
                                            <button className="startButton" onClick={startGame}>{(roundPlayed === 0) ? "Start Game" : "Play Next Round"}</button>
                                        </div>
                                    </>
                                    :
                                    <>
                                        <div id="membersMessageContainer" className="preventSelect">
                                            {(roundPlayed === 0) ? "Waiting for the admin to start the game !!!" : "Waiting for the admin to start next round"}
                                        </div>
                                    </>
                            }
                        </>
                }
            </div>
        </>
    )
}

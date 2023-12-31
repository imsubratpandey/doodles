import React, { useRef, useState, useEffect } from "react";
import { addMessageRoute } from "../utils/APIRoutes";
import axios from "axios";
import "../css/ChatBox.css";

interface Props {
    members: any;
    playgroundMessages: {
        from: string,
        message: string
    }[],
    drawerDoodleId: string,
    setPlaygroundMessages: any,
    playgroundDetails: any,
    setPlaygroundDetails: any,
    socketConnection: any
}

export default function ChatBox({ drawerDoodleId, members, playgroundMessages, setPlaygroundMessages, playgroundDetails, setPlaygroundDetails, socketConnection }: Props) {
    const messageRef = useRef<HTMLInputElement>(null);
    const [user, setUser] = useState<any>();
    const scrollRef = useRef<any>();
    const [values, setValues] = useState({ message: "" });

    useEffect(() => {
        async function fetchData() {
            if (socketConnection) {
                setUser(await JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY as string) as any));
                socketConnection.on("recieve-message", async (payload: any) => {
                    if (payload.guessed === true) {
                        members.forEach((member: { doodleId: "string", username: string, score: number, totalScore: number }) => {
                            if (member.doodleId === payload.doodleId) {
                                member.score = payload.score;
                                member.totalScore = payload.totalScore;
                            }
                        })
                    }
                    setPlaygroundMessages([...playgroundMessages, { from: payload.from, message: payload.message }]);
                });
            }
        }
        fetchData();
    }, [members, socketConnection, playgroundMessages, setPlaygroundMessages]);
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [playgroundMessages]);
    const handleSubmit = async (event: any) => {
        event.preventDefault();
        if (handleValidation() && messageRef.current) {
            try {
                const { data } = await axios.post(addMessageRoute, { playgroundId: playgroundDetails.playgroundId, doodleId: user.doodleId, drawerId: drawerDoodleId, username: user.username, message: values.message }, { withCredentials: true });
                if (data.status === true && data.guessed === true) {
                    setPlaygroundMessages([...playgroundMessages, { from: user.username, message: `${user.username} guessed the word` }]);
                    members.forEach((member: { doodleId: "string", username: string, score: number, totalScore: number }) => {
                        if (member.doodleId === user.doodleId) {
                            member.score = data.score;
                            member.totalScore = data.totalScore;
                        }
                    })
                    messageRef.current.value = "";
                    const payload = { from: user.username, message: `${user.username} guessed the word`, guessed: true, owner: playgroundDetails.owner, doodleId: user.doodleId, playgroundId: playgroundDetails.playgroundId, score: data.score, totalScore: data.totalScore };
                    socketConnection.emit("send-message", payload);
                }
                else if (data.status === true && data.guessed === false) {
                    setPlaygroundMessages([...playgroundMessages, { from: user.username, message: values.message }]);
                    messageRef.current.value = "";
                    const payload = { from: user.username, message: values.message, guessed: false, owner: playgroundDetails.owner, doodleId: user.doodleId, playgroundId: playgroundDetails.playgroundId };
                    socketConnection.emit("send-message", payload);
                }
            } catch (err) {
                console.log(err);
            }
        }
    };
    const handleValidation = () => {
        if (values.message !== "") {
            return true;
        }
        else {
            return false;
        }
    };
    const handleChange = (event: any) => { setValues({ ...values, [event.target.name]: event.target.value }) };
    return (
        <div id="chatBoxContainer">
            <div id="messagesContainer">
                {playgroundMessages.map((message: { from: string, message: string }, i: number) => {
                    return (
                        <div ref={scrollRef} className="messageBox" key={i}>
                            <div className="messageSenderName preventSelect">
                                {message.from}
                            </div>
                            <div className="messageContent">
                                {message.message}
                            </div>
                        </div>
                    );
                })}
            </div>
            <form id="chatInputForm" onSubmit={(event) => handleSubmit(event)}>
                <input id="chatBoxInput" type="text" placeholder="Enter your message" name="message" onChange={(e) => handleChange(e)} ref={messageRef} autoComplete="off" />
                <button id="chatBoxButton" type="submit">
                    <svg id="chatBoxButtonIcon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="10px" height="10px"><path opacity="1.000000" stroke="none" d="M 22.432 0.504 C 23.748 2.368 23.806 2.473 25.039 3.104 C 39.036 10.258 53.044 17.39 67.033 24.559 C 94.143 38.452 121.338 52.183 148.304 66.351 C 160.914 72.976 173.819 79.005 186.382 85.691 C 212.542 99.614 239.132 112.694 265.391 126.414 C 278.016 133.01 290.9 139.083 303.477 145.748 C 329.518 159.546 355.844 172.778 382.107 186.138 C 407.648 199.13 433.079 212.339 458.563 225.443 C 467.878 230.233 477.295 234.834 486.502 239.822 C 492.942 243.312 497.055 248.465 496.957 256.385 C 496.859 264.225 493.498 269.73 486.541 273.253 C 467.393 282.951 448.268 292.695 429.151 302.456 C 402.749 315.938 376.354 329.433 349.973 342.957 C 324.327 356.104 298.712 369.312 273.068 382.463 C 246.7 395.986 220.305 409.454 193.939 422.98 C 168.441 436.061 142.976 449.207 117.476 462.285 C 90.95 475.89 64.322 489.3 37.925 503.151 C 32.627 505.932 26.91 508.123 22.555 512.261 C 17.212 512.504 11.524 512.504 5.368 512.504 C -4.948 507.387 -7.703 500.32 -4.842 487.085 C -0.726 468.039 3.615 449.042 7.922 430.04 C 17.421 388.135 26.68 346.177 36.126 304.26 C 37.488 298.22 40.1 295.412 46.434 294.339 C 97.328 285.718 148.177 276.829 199.038 268.013 C 219.547 264.458 240.055 260.895 260.576 257.409 C 262.881 257.017 265.171 256.529 266.597 256.533 C 246.662 253.376 225.867 249.674 205.059 246.058 C 156.825 237.679 108.589 229.314 60.342 221.013 C 55.254 220.138 50.217 218.804 45.095 218.351 C 39.563 217.86 37.449 214.766 36.401 209.819 C 33.707 197.112 30.665 184.48 27.842 171.8 C 17.164 123.845 6.352 75.92 -4.443 27.992 C -5.407 23.713 -5.722 19.438 -5.522 15.099 C -5.212 8.381 -2.722 3.139 4.573 0.763 C 10.588 0.504 16.276 0.504 22.432 0.504 Z" /></svg>
                </button>
            </form>
        </div >
    )
}

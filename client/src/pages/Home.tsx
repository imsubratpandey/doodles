import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Flip, ToastContainer, toast } from "react-toastify";
import { userValidationRoute, createPlaygroundRoute, joinPlaygroundRoute } from "../utils/APIRoutes";
import axios from "axios";
import "../css/Home.css";

export default function Home() {
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
    const [values, setValues] = useState({ playgroundId: "" });
    const [showHomeLoadingWindow, setShowHomeLoadingWindow] = useState(false);
    const [showIdForm, setShowIdForm] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    useEffect(() => {
        async function fetchData() {
            if (localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY as string)) {
                const user = await JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY as string) as any);
                try {
                    const { data } = await axios.post(userValidationRoute, { doodleId: user.doodleId }, { withCredentials: true });
                    if (data.isDoodleUser === true && data.isTokenValid === true) {
                        setIsLoggedIn(true);
                    }
                } catch (err) {
                    console.log(err);
                }
            }
        }
        fetchData();
    }, [navigate]);
    const createPlayground = async () => {
        setShowHomeLoadingWindow(true);
        if (isLoggedIn === true) {
            const user = await JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY as string) as any);
            try {
                const { data } = await axios.post(createPlaygroundRoute, { doodleId: user.doodleId }, { withCredentials: true });
                if (data.status === true) {
                    if (!navigate) return;
                    navigate(`/${data.playgroundId}`);
                }
                else {
                    setShowHomeLoadingWindow(false);
                    toast.error(data.msg, toastOptions);
                }
            }
            catch (err) {
                setShowHomeLoadingWindow(false);
                console.log(err);
            }
        }
        else {
            if (!navigate) return;
            navigate("/login");
        }
    };
    const joinPlayground = async (event: any) => {
        event.preventDefault();
        setShowHomeLoadingWindow(true);
        if (isLoggedIn === true) {
            const user = await JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY as string) as any);
            try {
                setShowHomeLoadingWindow(true);
                const { data } = await axios.post(joinPlaygroundRoute, { doodleId: user.doodleId, playgroundId: values.playgroundId }, { withCredentials: true });
                if (data.status === true) {
                    if (!navigate) return;
                    navigate(`/${values.playgroundId}`);
                }
                else {
                    setShowHomeLoadingWindow(false);
                    toast.error(data.msg, toastOptions);
                }
            }
            catch (err) {
                setShowHomeLoadingWindow(false);
                console.log(err);
            }
        }
        else {
            if (!navigate) return;
            navigate("/login");
        }
    };
    const handleChange = (event: any) => { setValues({ ...values, [event.target.name]: event.target.value }) };
    return (
        <>
            <div id={(showHomeLoadingWindow === true) ? "homeLoadingWindowFlex" : "homeLoadingWindowNone"}>
                <svg className="containerCircleLoadingAnimation" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                    <circle className="trackCircleLoadingAnimation" cx="20" cy="20" r="17.5" fill="none" strokeWidth="5px" pathLength="100" />
                    <circle className="carCircleLoadingAnimation" cx="20" cy="20" r="17.5" fill="none" strokeWidth="5px" pathLength="100" />
                </svg>
            </div>
            <div id="homeContainer" className="preventSelect">
                <div id="homeHeader">
                    {
                        (showIdForm) ?
                            <>
                                <form id="inputForm" onSubmit={(event) => joinPlayground(event)}>
                                    <input id="idInput" type="text" placeholder="Playground Id" name="playgroundId" onChange={(e) => handleChange(e)} autoComplete="off" />
                                </form>
                            </>
                            :
                            <>
                            </>
                    }
                    <button className="homeButton" onClick={createPlayground}>
                        Create Playground
                    </button>
                    <button className="homeButton joinButton" onClick={() => { setShowIdForm(!showIdForm); }}>Join Playground</button>
                </div>
                <div id="homeContent">
                    <div id="homeTitle">
                        Doodles
                    </div>
                </div>
            </div >
            < ToastContainer bodyClassName="toastBody" style={{ backgroundColor: "rgba(0, 0, 0, 0)", overflow: "hidden" }} toastStyle={{ backgroundColor: "#FFFF" }} newestOnTop />
        </>
    )
}
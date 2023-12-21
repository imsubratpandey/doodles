import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { userValidationRoute, createPlaygroundRoute, joinPlaygroundRoute } from "../utils/APIRoutes";
import axios from "axios";
import "../css/Home.css";

export default function Home() {
    const navigate = useNavigate();
    const [values, setValues] = useState({ playgroundId: "" });
    const [showHomeLoadingWindow, setShowHomeLoadingWindow] = useState(false);
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
    }, [navigate]);
    const createPlayground = async () => {
        const user = await JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY as string) as any);
        try {
            const { data } = await axios.post(createPlaygroundRoute, { doodleId: user.doodleId }, { withCredentials: true });
            if (data.status === true) {
                if (!navigate) return;
                navigate(`/${data.playgroundId}`);
            }
            else {
                toast.error(data.msg);
            }
        }
        catch (err) {
            console.log(err);
        }
    };
    const joinPlayground = async (event: any) => {
        event.preventDefault();
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
                toast.error(data.msg);
            }
        }
        catch (err) {
            console.log(err);
        }
    };
    const handleChange = (event: any) => { setValues({ ...values, [event.target.name]: event.target.value }) };
    return (
        <>
            <div id={(showHomeLoadingWindow === true) ? "homeLoadingWindowFlex" : "homeLoadingWindowNone"}>
                Loading
            </div>
            <div id="playgroundButtons">
                <button onClick={createPlayground}>Create Playground</button>
                <form onSubmit={(event) => joinPlayground(event)}>
                    <input type="text" placeholder="Playground Id" name="playgroundId" onChange={(e) => handleChange(e)} autoComplete="off" />
                    <button type="submit">Join Playground</button>
                </form>
            </div>
            <ToastContainer style={{ backgroundColor: "rgba(0, 0, 0, 0)", overflow: "hidden" }} toastStyle={{ backgroundColor: "#1b1b1b" }} newestOnTop />
        </>
    )
}
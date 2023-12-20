import React, { useEffect } from "react";
import { ToastContainer } from "react-toastify";
import { userValidationRoute } from "../utils/APIRoutes";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../css/Home.css";

export default function Home() {
    const navigate = useNavigate();
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
    return (
        <>
            <div id="playgroundButtons">
                <button>Create Playground</button>
                <button>Join Playground</button>
            </div>
            <ToastContainer style={{ backgroundColor: "rgba(0, 0, 0, 0)", overflow: "hidden" }} toastStyle={{ backgroundColor: "#1b1b1b" }} newestOnTop />
        </>
    )
}
import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import { loginRoute, userValidationRoute } from "../utils/APIRoutes";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";
import "../css/Login.css";

export default function Login() {
    const navigate = useNavigate();
    const [values, setValues] = useState({ username: "", password: "" });
    useEffect(() => {
        async function fetchData() {
            if (localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY as string)) {
                const user = await JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY as string) as any);
                if (user.isLoggedIn === true) {
                    try {
                        const { data } = await axios.post(userValidationRoute, { _id: user._id, username: user.username }, { withCredentials: true });
                        if (data.isDoodleUser === true && data.isTokenValid === true) {
                            if (!navigate) return;
                            navigate("/");
                        }
                    } catch (err) {
                        console.log(err);
                    }
                }
            }
        }
        fetchData();
    }, [navigate]);
    const handleSubmit = async (event: any) => {
        event.preventDefault();
        if (handleValidation()) {
            const { password, username } = values;
            try {
                const { data } = await axios.post(loginRoute, { username, password }, { withCredentials: true });
                if (data.status === true) {
                    const user = data.user;
                    user.isLoggedIn = true;
                    localStorage.setItem(process.env.REACT_APP_LOCALHOST_KEY as string, JSON.stringify(user));
                    navigate("/");
                }
                else {
                    console.log(data.msg);
                }
            } catch (err) {
                console.log(err);
            }
        }
    };
    const handleValidation = () => {
        const { password, username } = values;
        if (password === "" || username === "") { toast.error("Username and password required"); return false; }
        return true;
    };
    const handleChange = (event: any) => { setValues({ ...values, [event.target.name]: event.target.value }) };
    return (
        <>
            <div className="loginContainer">
                <form className="loginForm" onSubmit={(event) => handleSubmit(event)}>
                    <input type="text" placeholder="Username" name="username" onChange={(e) => handleChange(e)} min="3" autoComplete="off" />
                    <input type="password" placeholder="Password" name="password" onChange={(e) => handleChange(e)} autoComplete="off" />
                    <button type="submit">Log In</button>
                    <span>Don't have an account? <Link className="link" to="/register">Register</Link></span>
                </form>
            </div>
            <ToastContainer style={{ backgroundColor: "rgba(0, 0, 0, 0)", overflow: "hidden" }} toastStyle={{ backgroundColor: "#1b1b1b" }} newestOnTop />
        </>
    )
}
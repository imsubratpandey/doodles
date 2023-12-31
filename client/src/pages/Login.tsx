import React, { useState, useEffect } from "react";
import { Flip, ToastContainer, toast } from "react-toastify";
import { loginRoute, userValidationRoute } from "../utils/APIRoutes";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";
import "../css/Login.css";

export default function Login() {
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
    const [values, setValues] = useState({ email: "", password: "" });
    useEffect(() => {
        async function fetchData() {
            if (localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY as string)) {
                const user = await JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY as string) as any);
                try {
                    const { data } = await axios.post(userValidationRoute, { doodleId: user.doodleId }, { withCredentials: true });
                    if (data.isDoodleUser === true && data.isTokenValid === true) {
                        if (!navigate) return;
                        navigate("/");
                    }
                } catch (err) {
                    console.log(err);
                }
            }
        }
        fetchData();
    }, [navigate]);
    const handleSubmit = async (event: any) => {
        event.preventDefault();
        if (handleValidation()) {
            const { password, email } = values;
            try {
                const { data } = await axios.post(loginRoute, { email, password }, { withCredentials: true });
                if (data.status === true) {
                    const user = data.user;
                    localStorage.setItem(process.env.REACT_APP_LOCALHOST_KEY as string, JSON.stringify(user));
                    navigate("/");
                }
                else {
                    toast.error(data.msg, toastOptions);
                }
            } catch (err) {
                console.log(err);
            }
        }
    };
    const handleValidation = () => {
        const { password, email } = values;
        if (password === "" || email === "") { toast.error("Email and password required", toastOptions); return false; }
        return true;
    };
    const handleChange = (event: any) => { setValues({ ...values, [event.target.name]: event.target.value }) };
    return (
        <>
            <div className="loginContainer">
                <div className="login-box">
                    <h2>Login</h2>
                    <form onSubmit={(event) => handleSubmit(event)}>
                        <div className="user-box">
                            <input type="email" name="email" onChange={(e) => handleChange(e)} min="3" autoComplete="off" />
                            <label>Email</label>
                        </div>
                        <div className="user-box">
                            <input type="password" name="password" onChange={(e) => handleChange(e)} autoComplete="off" />
                            <label>Password</label>
                        </div>
                        <button type="submit">
                            <span></span>
                            <span></span>
                            <span></span>
                            <span></span>
                            Submit
                        </button>
                    </form>
                </div>
                <span id="registerSpan">Don't have an account? <Link to="/register">Register</Link></span>
            </div>
            {/* <div className="loginContainer">
                <form className="loginForm" onSubmit={(event) => handleSubmit(event)}>
                    <input type="email" placeholder="Email" name="email" onChange={(e) => handleChange(e)} min="3" autoComplete="off" />
                    <input type="password" placeholder="Password" name="password" onChange={(e) => handleChange(e)} autoComplete="off" />
                    <button type="submit">Log In</button>
                    <span>Don't have an account? <Link className="link" to="/register">Register</Link></span>
                </form>
            </div> */}
            <ToastContainer bodyClassName="toastBody" style={{ backgroundColor: "rgba(0, 0, 0, 0)", overflow: "hidden" }} toastStyle={{ backgroundColor: "#FFFF" }} newestOnTop />
        </>
    )
}
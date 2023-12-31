import React, { useState, useEffect } from "react";
import { Flip, ToastContainer, toast } from "react-toastify";
import { registerRoute, userValidationRoute } from "../utils/APIRoutes";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../css/Register.css";

export default function Register() {
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
    const [values, setValues] = useState({ username: "", email: "", password: "", confirmPassword: "" });
    const handleSubmit = async (event: any) => {
        event.preventDefault();
        if (handleValidation()) {
            const { password, username, email } = values;
            try {
                const { data } = await axios.post(registerRoute, { username, email, password }, { withCredentials: true });
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
        const { password, confirmPassword, username, email } = values;
        if (username === "") {
            toast.error("Name is required", toastOptions);
            return false;
        }
        else if (/(?=.*\d)/.test(username)) {
            toast.error("Name should not contain numbers", toastOptions);
            return false;
        }
        else if (/^(?=.*[-+_!@#$%^&*.,?])/.test(username)) {
            toast.error("Name should not contain special characters", toastOptions);
            return false;
        }
        else if (email === "") {
            toast.error("Email is required");
            return false;
        }
        else if (!(/^\w+([-]?\w+)*@\w+([-]?\w+)*(\.\w{2,3})+$/.test(email))) {
            toast.error("Invalid Email", toastOptions);
            return false;
        }
        else if (username.length < 3) {
            toast.error("Name should be greater than or equal to 3 characters", toastOptions);
            return false;
        }
        else if (password.length < 8) {
            toast.error("Password should be greater than or equal to 8 characters", toastOptions);
            return false;
        }
        else if (password !== confirmPassword) {
            toast.error("Password and confirm password should same", toastOptions);
            return false;
        }
        return true;
    };
    const handleChange = (event: any) => { setValues({ ...values, [event.target.name]: event.target.value }) };
    return (
        <>
            <div className="registerContainer">
                <div className="register-box">
                    <h2>Register</h2>
                    <form onSubmit={(event) => handleSubmit(event)}>
                        <div className="user-box">
                            <input type="text" name="username" onChange={(e) => handleChange(e)} autoComplete="off" />
                            <label>Name</label>
                        </div>
                        <div className="user-box">
                            <input type="email" name="email" onChange={(e) => handleChange(e)} min="3" autoComplete="off" />
                            <label>Email</label>
                        </div>
                        <div className="user-box">
                            <input type="password" name="password" onChange={(e) => handleChange(e)} autoComplete="off" />
                            <label>Password</label>
                        </div>
                        <div className="user-box">
                            <input type="password" name="confirmPassword" onChange={(e) => handleChange(e)} autoComplete="off" />
                            <label>Confirm Password</label>
                        </div>
                        <button type="submit">
                            <span></span>
                            <span></span>
                            <span></span>
                            <span></span>
                            Create User
                        </button>
                    </form>
                </div>
                <span id="loginSpan">Already have an account? <Link to="/login">Login</Link></span>
            </div>
            {/* <div className="registerContainer">
                <form className="registerForm" onSubmit={(event) => handleSubmit(event)}>
                    <input type="text" placeholder="Name" name="username" onChange={(e) => handleChange(e)} autoComplete="off" />
                    <input type="email" placeholder="Email" name="email" onChange={(e) => handleChange(e)} autoComplete="off" />
                    <input type="password" placeholder="Password" name="password" onChange={(e) => handleChange(e)} autoComplete="off" />
                    <input type="password" placeholder="Confirm Password" name="confirmPassword" onChange={(e) => handleChange(e)} autoComplete="off" />
                    <button type="submit">Create User</button>
                    <span>Already have an account? <Link to="/login">Login</Link></span>
                </form>
            </div> */}
            <ToastContainer bodyClassName="toastBody" style={{ backgroundColor: "rgba(0, 0, 0, 0)", overflow: "hidden" }} toastStyle={{ backgroundColor: "#FFFF" }} newestOnTop />
        </>
    )
}
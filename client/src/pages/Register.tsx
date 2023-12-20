import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import { registerRoute, userValidationRoute } from "../utils/APIRoutes";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../css/Register.css";

export default function Register() {
    const navigate = useNavigate();
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
                    toast.error(data.msg);
                }
            } catch (err) {
                console.log(err);
            }
        }
    };
    const handleValidation = () => {
        const { password, confirmPassword, username, email } = values;
        if (username === "") {
            toast.error("Name is required");
            return false;
        }
        else if (/(?=.*\d)/.test(username)) {
            toast.error("Name should not contain numbers");
            return false;
        }
        else if (/^(?=.*[-+_!@#$%^&*.,?])/.test(username)) {
            toast.error("Name should not contain special characters");
            return false;
        }
        else if (email === "") {
            toast.error("Email is required");
            return false;
        }
        else if (!(/^\w+([-]?\w+)*@\w+([-]?\w+)*(\.\w{2,3})+$/.test(email))) {
            toast.error("Invalid Email");
            return false;
        }
        else if (username.length < 3) {
            toast.error("Name should be greater than or equal to 3 characters");
            return false;
        }
        else if (password.length < 8) {
            toast.error("Password should be greater than or equal to 8 characters");
            return false;
        }
        else if (password !== confirmPassword) {
            toast.error("Password and confirm password should same");
            return false;
        }
        return true;
    };
    const handleChange = (event: any) => { setValues({ ...values, [event.target.name]: event.target.value }) };
    return (
        <>
            <div className="registerContainer">
                <form className="registerForm" onSubmit={(event) => handleSubmit(event)}>
                    <input type="text" placeholder="Name" name="username" onChange={(e) => handleChange(e)} autoComplete="off" />
                    <input type="email" placeholder="Email" name="email" onChange={(e) => handleChange(e)} autoComplete="off" />
                    <input type="password" placeholder="Password" name="password" onChange={(e) => handleChange(e)} autoComplete="off" />
                    <input type="password" placeholder="Confirm Password" name="confirmPassword" onChange={(e) => handleChange(e)} autoComplete="off" />
                    <button type="submit">Create User</button>
                    <span>Already have an account? <Link to="/login">Login</Link></span>
                </form>
            </div>
            <ToastContainer style={{ backgroundColor: "rgba(0, 0, 0, 0)", overflow: "hidden" }} toastStyle={{ backgroundColor: "#1b1b1b" }} newestOnTop />
        </>
    )
}
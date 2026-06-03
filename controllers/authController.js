const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
require('dotenv').config()
const User = require('../models/user')

const Login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                code: 400, 
                status: "failure", 
                message: "Email and password are required." 
            });
        }

        const foundUser = await User.findOne({ email });
            if (!foundUser) {
                return res.status(401).json({
                    code: 401, 
                    status: "failure", 
                    message: "Invalid email or password." 
                });
            }

        const match = await foundUser.comparePassword(password);
            if (!match) {
                return res.status(401).json({ 
                    code: 401, 
                    status: "failure", 
                    message: "Invalid email or password." 
                });
            }

        const accessToken = jwt.sign({ 
            userId: foundUser.userId, email: foundUser.email }, 
            process.env.JWT_SECRET, 
            {expiresIn: process.env.JWT_EXPIRY}
        );

        return res.status(200).json({
            code: 200, 
            status: "success", 
            message: "Login successful", 
            data: {token: accessToken} 
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            code: 500, 
            status: "failure", 
            message: "Internal server error" 
        });
    }
}

const Register = async (req, res) => {
    try {
        const { email, password, businessName } = req.body;
        if (!email || !password || !businessName) {
            return res.status(400).json({
                code: 400, 
                status: "failure", 
                message: "Email, password and businessName are required." 
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                code: 400, 
                status: "failure", 
                message: "Invalid email format." 
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                code: 400, 
                status: "failure", 
                message: "Email already registered." 
            });
        }
        const user = new User({ email, password, businessName });
        await user.save();

        const accessToken = jwt.sign(
            { userId: user.userId, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRY }
        );

        return res.status(201).json({
            code: 201,
            status: "success",
            message: "Registration successful",
            data: {
                userId: user.userId,
                email: user.email,
                businessName: user.businessName,
                token: accessToken
            }
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            code: 500, 
            status: "failure", 
            message: "Internal server error" 
        });
    }
};
    
module.exports = {Login, Register}
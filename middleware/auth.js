const jwt = require('jsonwebtoken')
require('dotenv').config()

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers['authorization']
     if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            code: 401,
            status: "failure",
            message: "Access denied. No token provided."
        });
    }
    const token = authHeader.split(' ')[1] //* token position
    jwt.verify(
        token,
        process.env.JWT_SECRET,
        (err, decoded) =>{
            if (err) {
            return res.status(401).json({
                code: 401,
                status: "failure",
                message: "Invalid token."
            });
        }
        
        req.user = decoded;
        next();
    });

}

module.exports = verifyJWT;
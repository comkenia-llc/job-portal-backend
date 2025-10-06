const { User } = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {Op} = require('sequelize')

// Register user
exports.register = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        // validate
        if (!username || !email || !password) {
            return res.status(400).json({ error: "Username, email and password required" });
        }

        // hash password
        const passwordHash = await bcrypt.hash(password, 10);

        const user = await User.create({
            username,
            email,
            passwordHash,
            role: role || "candidate", // default role
            status: "active",
        });

        res.status(201).json(user);
    } catch (err) {
        console.error("❌ Register error:", err);
        res.status(500).json({ error: "Failed to register user" });
    }
};

// Login user
// Login user
exports.login = async (req, res) => {
    try {
        const { emailOrUsername, password } = req.body;

        const user = await User.findOne({
            where: {
                [Op.or]: [
                    { email: emailOrUsername },
                    { username: emailOrUsername }
                ]
            }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        // Sign JWT token
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || "secret",
            { expiresIn: "7d" }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                status: user.status
            }
        });
    } catch (err) {
        console.error("❌ Login error:", err);
        res.status(500).json({ error: "Server error" });
    }
};


// Get current user
exports.me = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ["passwordHash"] }
        });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch user" });
    }
};

// Admin: list users
exports.listUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ["passwordHash"] }
        });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch users" });
    }
};

// Admin: update user (e.g. suspend, promote)
exports.updateUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ error: "User not found" });

        await user.update(req.body);
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: "Failed to update user" });
    }
};

// Admin: delete user
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ error: "User not found" });

        await user.destroy();
        res.json({ message: "User deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete user" });
    }
};

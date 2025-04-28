import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../config/db.config.js";
const JWT_SECRET = process.env.JWT_SECRET!;

interface JwtPayload {
    id: string;
    role: "admin" | "customer";
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        req.user = decoded; // Attach decoded { id, role } to req
        next();
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
};

export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Forbidden: Admins only" });
    }

    // Optional: Verify admin still exists in database
    const admin = await prisma.admin.findUnique({
        where: { id: req.user.id }
    });

    if (!admin) {
        return res.status(403).json({ message: "Admin account not found" });
    }

    next();
};

export const isCustomer = (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== "customer") {
        return res.status(403).json({ message: "Forbidden: Customers only" });
    }
    next();
};

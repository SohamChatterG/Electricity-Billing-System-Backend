// src/controllers/notification.controller.ts
import { Request, Response } from 'express';
import prisma from '../config/db.config.js';

// Get user's last 10 notifications with read status
export const getNotifications = async (req: Request, res: Response) => {
    const { id } = req.user; // Assuming customer ID comes from auth

    try {
        const notifications = await prisma.notification.findMany({
            where: { customerId: id },
            orderBy: { sentAt: 'desc' },
            take: 10, // Last 10 notifications
            select: {
                id: true,
                title: true,
                message: true,
                isRead: true,
                sentAt: true
            }
        });

        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Failed to get notifications' });
    }
};

// Mark notification as read
export const markAsRead = async (req: Request, res: Response) => {
    const { id: notificationId } = req.params;
    const { id: customerId } = req.user;

    try {
        const notification = await prisma.notification.updateMany({
            where: {
                id: notificationId,
                customerId
            },
            data: { isRead: true }
        });

        if (notification.count === 0) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Error marking notification:', error);
        res.status(500).json({ message: 'Failed to update notification' });
    }
};
import excel from 'exceljs';
import { Response } from 'express';

import prisma from "../../config/db.config.js";
// Excel Report Types
export type ExcelCustomerData = {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    createdAt: Date;
}[];

export type ExcelBillData = {
    id: string;
    customer: { name: string };
    reading: { month: string; unitsConsumed: number };
    amount: number;
    dueDate: Date;
}[];

// Fetch Excel data based on report type
export const fetchExcelData = async (
    reportType: string,
    startDate?: string,
    endDate?: string
): Promise<{ data: ExcelCustomerData | ExcelBillData; fileName: string }> => {
    switch (reportType) {
        case 'customers':
            const customers = await prisma.customer.findMany({
                where: {
                    createdAt: {
                        gte: startDate ? new Date(startDate) : undefined,
                        lte: endDate ? new Date(endDate) : undefined,
                    },
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    address: true,
                    createdAt: true,
                },
            });
            return { data: customers, fileName: 'customers_report.xlsx' };

        case 'bills':
            const bills = await prisma.bill.findMany({
                where: {
                    createdAt: {
                        gte: startDate ? new Date(startDate) : undefined,
                        lte: endDate ? new Date(endDate) : undefined,
                    },
                },
                include: {
                    customer: { select: { name: true } },
                    reading: { select: { month: true, unitsConsumed: true } },
                },
            });
            return { data: bills, fileName: 'bills_report.xlsx' };

        default:
            throw new Error('Invalid report type');
    }
};

// Create Excel workbook with common settings
export const createExcelWorkbook = (): excel.Workbook => {
    return new excel.Workbook();
};

// Add worksheet with styled headers
export const addExcelWorksheet = (
    workbook: excel.Workbook,
    reportType: string
): excel.Worksheet => {
    const worksheet = workbook.addWorksheet('Report');

    // Style headers
    worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD3D3D3' },
        };
    });

    return worksheet;
};

// Generate customer worksheet
export const generateCustomerWorksheet = (
    worksheet: excel.Worksheet,
    customers: ExcelCustomerData
): void => {
    worksheet.columns = [
        { header: 'ID', key: 'id', width: 15 },
        { header: 'Name', key: 'name', width: 25 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Phone', key: 'phone', width: 15 },
        { header: 'Address', key: 'address', width: 40 },
        { header: 'Registered On', key: 'createdAt', width: 15 },
    ];

    customers.forEach((item) => {
        worksheet.addRow({
            ...item,
            createdAt: new Date(item.createdAt).toLocaleDateString(),
        });
    });
};

// Generate bill worksheet
export const generateBillWorksheet = (
    worksheet: excel.Worksheet,
    bills: ExcelBillData
): void => {
    worksheet.columns = [
        { header: 'Bill ID', key: 'id', width: 15 },
        { header: 'Customer', key: 'customer', width: 25 },
        { header: 'Billing Month', key: 'month', width: 15 },
        { header: 'Units Consumed', key: 'units', width: 15 },
        { header: 'Amount (₹)', key: 'amount', width: 15 },
        { header: 'Due Date', key: 'dueDate', width: 15 },
    ];

    bills.forEach((item) => {
        worksheet.addRow({
            id: item.id,
            customer: item.customer.name,
            month: item.reading.month,
            units: item.reading.unitsConsumed,
            amount: item.amount,
            dueDate: new Date(item.dueDate).toLocaleDateString(),
        });
    });
};

// Set Excel response headers
export const setExcelResponseHeaders = (
    res: Response,
    fileName: string
): void => {
    res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
};

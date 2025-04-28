import { Request, Response } from "express";
import prisma from "../config/db.config.js";
import { generateCsv } from "../utils/report/csvGenerator.js";
import { format } from "date-fns";
import {
    fetchReportData, createPDFDocument, addPDFMetadata, generateCustomerTable, generateBillTable,
} from "../utils/report/pdf.js";
import {
    fetchExcelData, createExcelWorkbook, addExcelWorksheet, generateCustomerWorksheet, generateBillWorksheet, setExcelResponseHeaders, ExcelCustomerData, ExcelBillData
} from "../utils/report/excel.js";
export const generateReport = async (req: Request, res: Response) => {
    const { reportType, startDate, endDate, customerId } = req.query;

    try {
        let data: any[];
        let filename: string;

        switch (reportType) {
            case "customers":
                data = await prisma.customer.findMany({
                    where: {
                        createdAt: {
                            gte: startDate ? new Date(startDate as string) : undefined,
                            lte: endDate ? new Date(endDate as string) : undefined,
                        },
                    },
                });
                console.log("data", data)
                filename = `customers_${format(new Date(), "yyyyMMdd")}.csv`;
                break;

            case "bills":
                data = await prisma.bill.findMany({
                    where: {
                        customerId: customerId as string || undefined,
                        createdAt: {
                            gte: startDate ? new Date(startDate as string) : undefined,
                            lte: endDate ? new Date(endDate as string) : undefined,
                        },
                    },
                    include: {
                        customer: true,
                        reading: true,
                    },
                });
                filename = `bills_${format(new Date(), "yyyyMMdd")}.csv`;
                break;

            case "units":
                data = await prisma.reading.findMany({
                    where: {
                        createdAt: {
                            gte: startDate ? new Date(startDate as string) : undefined,
                            lte: endDate ? new Date(endDate as string) : undefined,
                        },
                        connection: {
                            customerId: customerId as string || undefined,
                        },
                    },
                    include: {
                        connection: {
                            include: {
                                customer: true,
                            },
                        },
                    },
                });
                filename = `units_${format(new Date(), "yyyyMMdd")}.csv`;
                break;

            default:
                return res.status(400).json({ message: "Invalid report type" });
        }

        if (data.length === 0) {
            return res.status(404).json({ message: "No data found for the given filters" });
        }

        const csvData = generateCsv(data, reportType as string);

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
        res.status(200).send(csvData);

    } catch (error) {
        console.error("Report generation error:", error);
        res.status(500).json({ message: "Failed to generate report" });
    }
};

export const generatePDFReport = async (req: Request, res: Response) => {
    try {
        // Get report parameters
        const { reportType, startDate, endDate } = req.query;

        if (typeof reportType !== 'string') {
            return res.status(400).json({ message: 'Report type must be a string' });
        }

        // Fetch data using utility function
        const { data, title } = await fetchReportData(
            reportType,
            startDate as string,
            endDate as string
        );

        // Create PDF document using utility function
        const doc = createPDFDocument(res, reportType);

        // Add metadata using utility function
        addPDFMetadata(doc, title, startDate as string, endDate as string);

        // Generate appropriate table based on report type
        if (reportType === 'customers') {
            generateCustomerTable(doc, data as any);
        } else {
            generateBillTable(doc, data as any);
        }

        // Finalize PDF
        doc.end();
    } catch (error: any) {
        console.error('PDF generation error:', error);
        const status = error.message === 'Invalid report type' ? 400 : 500;
        res.status(status).json({ message: error.message || 'Failed to generate PDF report' });
    }
};


export const generateExcelReport = async (req: Request, res: Response) => {
    try {
        const { reportType, startDate, endDate } = req.query;

        if (typeof reportType !== 'string') {
            return res.status(400).json({ message: 'Report type must be a string' });
        }

        // Fetch data using utility function
        const { data, fileName } = await fetchExcelData(
            reportType,
            startDate as string,
            endDate as string
        );

        // Create workbook and worksheet
        const workbook = createExcelWorkbook();
        const worksheet = addExcelWorksheet(workbook, reportType);

        // Generate appropriate worksheet based on report type
        if (reportType === 'customers') {
            generateCustomerWorksheet(worksheet, data as ExcelCustomerData);
        } else {
            generateBillWorksheet(worksheet, data as ExcelBillData);
        }

        // Set response headers
        setExcelResponseHeaders(res, fileName);

        // Write to response
        await workbook.xlsx.write(res);
        res.end();
    } catch (error: any) {
        console.error('Excel generation error:', error);
        const status = error.message === 'Invalid report type' ? 400 : 500;
        res.status(status).json({ message: error.message || 'Failed to generate Excel report' });
    }
};

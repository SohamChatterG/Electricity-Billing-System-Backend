// src/utils/report.utils.ts
import PDFDocument from 'pdfkit';
import prisma from '../../config/db.config.js';

// Type definitions for report data
type CustomerReportData = {
    id: string;
    name: string;
    email: string;
    phone: string;
    createdAt: Date;
}[];

type BillReportData = {
    id: string;
    customer: { name: string };
    reading: { month: string; unitsConsumed: number };
    amount: number;
    dueDate: Date;
}[];

// Fetch data based on report type
export const fetchReportData = async (
    reportType: string,
    startDate?: string,
    endDate?: string
): Promise<{ data: CustomerReportData | BillReportData; title: string }> => {
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
                    createdAt: true,
                },
            });
            return { data: customers, title: 'Customer Report' };

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
            return { data: bills, title: 'Billing Report' };

        default:
            throw new Error('Invalid report type');
    }
};

// Generate PDF document with common settings
export const createPDFDocument = (
    res: any,
    reportType: string
): PDFKit.PDFDocument => {
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
        'Content-Disposition',
        `attachment; filename=${reportType}_report_${new Date()
            .toISOString()
            .slice(0, 10)}.pdf`
    );

    doc.pipe(res);
    return doc;
};

// Add common PDF elements (title, date range)
export const addPDFMetadata = (
    doc: PDFKit.PDFDocument,
    title: string,
    startDate?: string,
    endDate?: string
): void => {
    doc.fontSize(20).text(title, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(
        `Period: ${startDate || 'Beginning'} to ${endDate || 'Present'}`,
        { align: 'center' }
    );
    doc.moveDown(2);
};

// Generate customer table in PDF
export const generateCustomerTable = (
    doc: PDFKit.PDFDocument,
    customers: CustomerReportData
): void => {
    doc.font('Helvetica-Bold');
    doc.text('ID', 50, doc.y);
    doc.text('Name', 120, doc.y);
    doc.text('Email', 220, doc.y);
    doc.text('Phone', 350, doc.y);
    doc.text('Registered', 450, doc.y);
    doc.moveDown();
    doc.font('Helvetica');

    customers.forEach((customer) => {
        doc.text(customer.id.slice(0, 8), 50, doc.y);
        doc.text(customer.name, 120, doc.y);
        doc.text(customer.email, 220, doc.y);
        doc.text(customer.phone, 350, doc.y);
        doc.text(new Date(customer.createdAt).toLocaleDateString(), 450, doc.y);
        doc.moveDown();
    });
};

// Generate bill table in PDF
export const generateBillTable = (
    doc: PDFKit.PDFDocument,
    bills: BillReportData
): void => {
    doc.font('Helvetica-Bold');
    doc.text('Bill ID', 50, doc.y);
    doc.text('Customer', 120, doc.y);
    doc.text('Period', 220, doc.y);
    doc.text('Units', 300, doc.y);
    doc.text('Amount (₹)', 350, doc.y);
    doc.text('Due Date', 450, doc.y);
    doc.moveDown();
    doc.font('Helvetica');

    bills.forEach((bill) => {
        doc.text(bill.id.slice(0, 8), 50, doc.y);
        doc.text(bill.customer.name, 120, doc.y);
        doc.text(bill.reading.month, 220, doc.y);
        doc.text(bill.reading.unitsConsumed.toString(), 300, doc.y);
        doc.text(bill.amount.toFixed(2), 350, doc.y);
        doc.text(new Date(bill.dueDate).toLocaleDateString(), 450, doc.y);
        doc.moveDown();
    });
};
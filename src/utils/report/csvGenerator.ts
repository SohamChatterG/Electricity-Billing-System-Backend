// src/utils/csvGenerator.ts
// import { stringify } from 'csv-stringify';
import { stringify } from 'csv-stringify/sync'; // Synchronous version


interface CsvColumn {
    key: string;
    header: string;
}

export const generateCsv = (data: any[], reportType: string): string => {
    const { columns, transformedData } = getReportConfig(data, reportType);

    return stringify(transformedData, {
        header: true,
        columns,
        delimiter: '\t', // Tab delimiter for better readability
        quoted: true,
        quoted_empty: true,
        escape: '"',
        cast: {
            date: (value) => {
                try {
                    const date = new Date(value);
                    return date.toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    });
                } catch {
                    return 'Invalid Date';
                }
            },
            string: (value) => value?.toString().trim() || ''
        }
    });
};


function getReportConfig(data: any[], reportType: string) {
    // Common formatters
    const formatPhone = (phone: string) =>
        phone?.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3') || '';

    const formatDate = (date: Date | string) => {
        try {
            const d = new Date(date);
            return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN');
        } catch {
            return '';
        }
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);

    switch (reportType) {
        case "customers":
            return {
                columns: [
                    { key: "id", header: "🔷 Customer ID" },
                    { key: "name", header: "👤 Full Name" },
                    { key: "email", header: "📧 Email" },
                    { key: "phone", header: "📞 Phone" },
                    { key: "address", header: "🏠 Address" },
                    { key: "createdAt", header: "📅 Registration Date" }
                ],
                transformedData: data.map(customer => ({
                    id: `"${customer.id}"`,
                    name: `"${customer.name?.toUpperCase()}"`,
                    email: `"✉️ ${customer.email}"`,
                    phone: `"${formatPhone(customer.phone)}"`,
                    address: `"📍 ${customer.address?.replace(/"/g, "'")}"`,
                    createdAt: formatDate(customer.createdAt)
                }))
            };

        case "bills":
            return {
                columns: [
                    { key: "id", header: "🧾 Bill ID" },
                    { key: "customerName", header: "👤 Customer" },
                    { key: "period", header: "📅 Billing Period" },
                    { key: "units", header: "⚡ Units Consumed" },
                    { key: "amount", header: "💵 Amount" },
                    { key: "dueDate", header: "⏰ Due Date" },
                    { key: "status", header: "✅ Status" }
                ],
                transformedData: data.map(bill => ({
                    id: `"${bill.id}"`,
                    customerName: `"${bill.customer?.name?.toUpperCase()}"`,
                    period: `"${bill.reading?.month}"`,
                    units: `"${bill.reading?.unitsConsumed}"`,
                    amount: `"${formatCurrency(bill.amount)}"`,
                    dueDate: formatDate(bill.dueDate),
                    status: `"${bill.isPaid ? '✅ Paid' : '❌ Pending'}"`
                }))
            };

        case "units":
            return {
                columns: [
                    { key: "id", header: "🔢 Reading ID" },
                    { key: "customerName", header: "👤 Customer" },
                    { key: "meterNumber", header: "🔌 Meter No" },
                    { key: "month", header: "📅 Month" },
                    { key: "previous", header: "🔙 Previous" },
                    { key: "current", header: "🔜 Current" },
                    { key: "consumed", header: "⚡ Consumed" }
                ],
                transformedData: data.map(reading => ({
                    id: `"${reading.id}"`,
                    customerName: `"${reading.connection?.customer?.name?.toUpperCase()}"`,
                    meterNumber: `"${reading.connection?.meterNumber}"`,
                    month: `"${reading.month}"`,
                    previous: `"${reading.previousUnit}"`,
                    current: `"${reading.currentUnit}"`,
                    consumed: `"${reading.unitsConsumed}"`
                }))
            };

        default:
            throw new Error(`Invalid report type: ${reportType}`);
    }
}
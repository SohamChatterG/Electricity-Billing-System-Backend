// src/utils/billingCalculator.ts
export const calculateConsumptionCharge = (units: number, connectionType: string): number => {
    // Example tariff rates (customize based on your requirements)
    const rates = {
        residential: {
            first100: 3.5,
            next200: 4.5,
            above300: 6.0,
            fixedCharge: 50,
        },
        commercial: {
            first100: 5.0,
            next200: 6.5,
            above300: 8.0,
            fixedCharge: 100,
        },
    };

    const tariff = rates[connectionType as keyof typeof rates] || rates.residential;

    let charge = tariff.fixedCharge;

    if (units <= 100) {
        charge += units * tariff.first100;
    } else if (units <= 300) {
        charge += 100 * tariff.first100 + (units - 100) * tariff.next200;
    } else {
        charge += 100 * tariff.first100 + 200 * tariff.next200 + (units - 300) * tariff.above300;
    }

    // Add taxes (example: 5% GST)
    return parseFloat((charge * 1.05).toFixed(2));
};
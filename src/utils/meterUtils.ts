export const generateMeterNumber = (): string => {
    const prefix = "MTR";
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}-${randomNum}`;
};
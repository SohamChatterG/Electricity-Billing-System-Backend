import { PrismaClient } from "@prisma/client"; // match your output path

const prisma = new PrismaClient({
    log: ["error", "query"]
})

export default prisma;
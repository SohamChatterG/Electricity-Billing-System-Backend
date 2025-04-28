import express, { Application, Request, Response } from "express";
import "dotenv/config";
import cors from "cors";
const app: Application = express();
const PORT = process.env.PORT || 7000;
import authRoutes from "./route/authRoutes.js";  // Import authRoutes
import reportRoutes from "./route/reportRoutes.js"
import meterRoutes from "./route/meterRoute.js"
import connectionRoutes from "./route/connectionRoutes.js"
import notificationRoutes from "./route/notificationRoutes.js"
import customerRoutes from "./route/customerRoutes.js"
import billRoutes from './route/billRoutes.js';
import paymentRoutes from './route/paymentRoutes.js'
// * Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/connection", connectionRoutes);
app.use("/api/meter", meterRoutes)
app.use("/api/notification", notificationRoutes)
app.use("/api/customers", customerRoutes)
app.use("/api/bills", billRoutes);
app.use("/api/payment", paymentRoutes);
app.get("/", (req: Request, res: Response) => {
  return res.send("It's working 🙌");
});

app.listen(PORT, () => console.log(`Server is running on PORT ${PORT}`));

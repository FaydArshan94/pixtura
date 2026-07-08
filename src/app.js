import express from "express"
import mediaRoutes from "./routes/mediaRoutes.js"
import authRoutes from "./routes/authRoutes.js"
import folderRoutes from "./routes/folderRoutes.js"
import cookieParser from "cookie-parser"
import cors from "cors"





const app = express()


app.use(
  cors({
    origin: ["http://localhost:3000", "https://pixtura-dashboard.vercel.app"],
    credentials: true,
  })
);

app.use(cookieParser())



app.use(express.json())
app.use(express.urlencoded({ extended: true }))


app.use("/api/media", mediaRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/folders", folderRoutes)


export default app
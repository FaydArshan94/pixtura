import express from "express"
import mediaRoutes from "./routes/mediaRoutes.js"
import authRoutes from "./routes/authRoutes.js"
import cookieParser from "cookie-parser"


const app = express()
app.use(cookieParser())

app.use(express.json())
app.use(express.urlencoded({ extended: true }))


app.use("/api/media", mediaRoutes)
app.use("/api/auth", authRoutes)


export default app
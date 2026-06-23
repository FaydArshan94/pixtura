import "dotenv/config";
import app from "./src/app.js";
import  connectDB  from "./src/config/db.js";

connectDB();

app.get("/health", (req, res) => {
  res.send("Server is running fine 😎");
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

import express from "express";
import userRouter from "./routes/user.router";
import authRouter from "./routes/auth.router";
// import productRouter from "./routes/product.router";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Prisma Practice API" });
});

app.use("/users", userRouter);
app.use("/auth", authRouter);
// app.use('/products', productRouter)

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});

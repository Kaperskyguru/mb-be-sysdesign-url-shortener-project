const express = require("express");

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ ok: true, message: "Your backend is running  as🎉" });
});

app.get("/health", (req, res) => {
  res.json({ status: "healthy" });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

console.log("This is good as")
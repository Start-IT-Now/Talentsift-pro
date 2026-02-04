import express from "express";
import nodemailer from "nodemailer";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import servicenowRoutes from "./routes/servicenow.js";

dotenv.config();

const app = express();
app.use(bodyParser.json());

app.use(express.json({ limit: "15mb" })); // ✅ to allow big AI JSON

app.use("/api/servicenow", servicenowRoutes);

app.get("/", (req, res) => {
  res.send("Backend Running ✅");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));


app.post("/api/sendEmail", async (req, res) => {
  const { to, subject, results } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const html = results.map(r => `
      <p><b>${r.name}</b> - Score: ${r.score}</p>
      <p>Email: ${r.email} | Phone: ${r.phone}</p>
      <p>Reason: ${r.justification}</p><hr/>
    `).join("");

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    });

    res.json({ message: "Email sent!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(5000, () => console.log("Server running on http://localhost:5000"));

// /api/validateUser.js

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ status: "error", message: "Method not allowed. Use POST." });
  }

  const { email } = req.body || {};

  if (!email) {
    return res.status(400).json({ status: "error", message: "Email is required" });
  }

  const domain = email.split("@")[1]?.toLowerCase();
  const allowedDomains = ["startitnow.co.in", "zoho.com"];

  if (allowedDomains.includes(domain)) {
    return res.status(200).json({ status: "success", message: "User validated" });
  } else {
    return res
      .status(403)
      .json({ status: "error", message: "Unauthorized company domain" });
  }
}
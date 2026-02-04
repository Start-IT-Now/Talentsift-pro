import { google } from "googleapis";

export default async function handler(req, res) {
  console.log("🟩 API call received at /api/logToGoogleSheet");

  if (req.method !== "POST") {
    console.warn("⚠️ Invalid method:", req.method);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, resumeCount, caseId } = req.body;
  console.log("📦 Incoming body:", { email, resumeCount, caseId });

  if (!email || !resumeCount || !caseId) {
    console.error("❌ Missing required fields");
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    console.log("🟨 Starting Google Auth setup...");

    const projectId = process.env.GOOGLE_PROJECT_ID;
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      console.error("❌ Missing environment variables");
      return res.status(500).json({ error: "Missing environment variables" });
    }

    console.log("🔑 Private key preview (first 50 chars):", privateKey.slice(0, 50));
    console.log("📧 Client email:", clientEmail);
    console.log("🪪 Project ID:", projectId);

    // Fix private key formatting if needed
    privateKey = privateKey.replace(/\\n/g, "\n");

    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: "service_account",
        project_id: projectId,
        private_key: privateKey,
        client_email: clientEmail,
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    console.log("✅ Auth object created successfully");

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    console.log("📄 Spreadsheet ID:", spreadsheetId);

    if (!spreadsheetId) {
      console.error("❌ Missing GOOGLE_SHEET_ID");
      return res.status(500).json({ error: "Missing GOOGLE_SHEET_ID" });
    }

    const values = [[
      caseId,
      email,
      resumeCount,
      new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    ]];

    console.log("🧾 Data to append:", values);

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Sheet1",
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });

const metadata = await sheets.spreadsheets.get({ spreadsheetId });
const sheetNames = metadata.data.sheets.map(s => s.properties.title);
console.log("✅ Available sheets:", sheetNames);


    console.log("✅ Google Sheets API response:", response.status, response.statusText);

    res.status(200).json({ message: "Logged to Google Sheet ✅" });
  } catch (error) {
    console.error("❌ Error logging to Google Sheets:");
    console.error("Error message:", error.message);
    if (error.response?.data) console.error("Google API error:", error.response.data);
    console.error("Full error object:", JSON.stringify(error, null, 2));

    res.status(500).json({ error: error.message || "Failed to log data" });
  }
}
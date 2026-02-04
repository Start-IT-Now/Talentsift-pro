import express from "express";
const router = express.Router();

// POST /api/servicenow/storeResults
router.post("/storeResults", async (req, res) => {
  try {
    const {
      case_id,
      job_title,
      job_type,
      years_of_experience,
      industry,
      email,
      skills,
      job_description,
      ai_results,
    } = req.body;

    if (!case_id) {
      return res.status(400).json({ message: "case_id is required" });
    }

    const instanceUrl = process.env.SN_INSTANCE_URL;
    const username = process.env.SN_USERNAME;
    const password = process.env.SN_PASSWORD;
    const table = process.env.SN_TABLE || "u_resume_ranking";

    if (!instanceUrl || !username || !password) {
      return res.status(500).json({
        message: "ServiceNow credentials missing in .env",
      });
    }

    const auth =
      "Basic " + Buffer.from(`${username}:${password}`).toString("base64");

    // ✅ 1) Check if record already exists using case_id
    const checkUrl = `${instanceUrl}/api/now/table/${table}?sysparm_query=u_case_id=${case_id}&sysparm_limit=1`;

    const checkRes = await fetch(checkUrl, {
      method: "GET",
      headers: {
        Authorization: auth,
        Accept: "application/json",
      },
    });

    const checkData = await checkRes.json();

    if (!checkRes.ok) {
      return res.status(checkRes.status).json({
        message: checkData?.error?.message || "ServiceNow lookup failed",
        details: checkData,
      });
    }

    // ✅ 2) Build record body (map your payload → ServiceNow fields)
    const recordBody = {
      u_case_id: case_id,
      u_job_title: job_title || "",
      u_job_type: job_type || "",
      u_years_of_experience: years_of_experience || "",
      u_industry: industry || "",
      u_email: email || "",
      u_required_skills: skills || "",
      u_job_description: job_description || "",

      // ✅ Save full JSON as string
      u_ai_results: JSON.stringify(ai_results || {}),
    };

    let snRes;
    let snData;
    let action = "";

    // ✅ 3) If exists update else create
    if (checkData?.result?.length > 0) {
      action = "updated";
      const sysId = checkData.result[0].sys_id;

      snRes = await fetch(`${instanceUrl}/api/now/table/${table}/${sysId}`, {
        method: "PUT",
        headers: {
          Authorization: auth,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(recordBody),
      });
    } else {
      action = "created";
      snRes = await fetch(`${instanceUrl}/api/now/table/${table}`, {
        method: "POST",
        headers: {
          Authorization: auth,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(recordBody),
      });
    }

    snData = await snRes.json();

    if (!snRes.ok) {
      return res.status(snRes.status).json({
        message: snData?.error?.message || "ServiceNow create/update failed",
        details: snData,
      });
    }

    return res.json({
      status: "success",
      action,
      sys_id: snData.result.sys_id,
      number: snData.result.number,
      result: snData.result,
    });
  } catch (err) {
    console.error("❌ ServiceNow storeResults error:", err);
    return res.status(500).json({ message: err.message });
  }
});

export default router;

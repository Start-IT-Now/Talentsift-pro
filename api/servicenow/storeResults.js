export default async function handler(req, res) {
  // Only POST allowed
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

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
    } = req.body || {};

    if (!case_id) {
      return res.status(400).json({ message: "case_id is required" });
    }

    // ✅ read from env (Vercel env vars)
    const instanceUrl = process.env.SN_INSTANCE_URL;
    const username = process.env.SN_USERNAME;
    const password = process.env.SN_PASSWORD;
    const table = process.env.SN_TABLE || "u_resume_ranking";

    if (!instanceUrl || !username || !password) {
      return res.status(500).json({
        message:
          "Missing ServiceNow env vars (SN_INSTANCE_URL, SN_USERNAME, SN_PASSWORD, SN_TABLE). Add them in Vercel dashboard.",
      });
    }

    const auth =
      "Basic " + Buffer.from(`${username}:${password}`).toString("base64");

    // ✅ Map to ServiceNow table fields
    const recordBody = {
      u_case_id: case_id,
      u_job_title: job_title || "",
      u_job_type: job_type || "",
      u_years_of_experience: years_of_experience || "",
      u_industry: industry || "",
      u_email: email || "",
      u_required_skills: skills || "",
      u_job_description: job_description || "",
      u_ai_results: JSON.stringify(ai_results || {}),
    };

    // ✅ 1) Lookup existing record by u_case_id
    const checkUrl = `${instanceUrl}/api/now/table/${table}?sysparm_query=u_case_id=${case_id}&sysparm_limit=1`;

    const checkRes = await fetch(checkUrl, {
      method: "GET",
      headers: {
        Authorization: auth,
        Accept: "application/json",
      },
    });

    const checkJson = await checkRes.json();

    if (!checkRes.ok) {
      return res.status(400).json({
        message: checkJson?.error?.message || "ServiceNow lookup failed",
        details: checkJson,
      });
    }

    // ✅ 2) Create or Update
    let snRes;
    if (checkJson?.result?.length > 0) {
      const sysId = checkJson.result[0].sys_id;

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

    const snJson = await snRes.json();

    if (!snRes.ok) {
      return res.status(400).json({
        message: snJson?.error?.message || "ServiceNow create/update failed",
        details: snJson,
      });
    }

    return res.status(200).json({
      status: "success",
      sys_id: snJson.result.sys_id,
      number: snJson.result.number,
    });
  } catch (err) {
    console.error("ServiceNow storeResults error:", err);
    return res.status(500).json({ message: err.message });
  }
}

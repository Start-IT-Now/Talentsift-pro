import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import Footer from "@/components/Footer";
import JobFormStep1 from "@/components/JobFormStep1";
import ResumeList from "@/components/existing";
import logo from "./logo.png";

function App() {
  const [formData, setFormData] = useState({
    jobTitle: "",
    yearsOfExperience: "",
    jobType: "",
    industry: "",
    email: "",
    requiredSkills: "",
    jobDescription: "",
    resumeFiles: [],
  });

  const [orgId, setOrgId] = useState(null); 
  const [submittedExisting, setSubmittedExisting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Auto-populate jobDescription and requiredSkills from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const decodeSafe = (str) => {
      try {
        return decodeURIComponent(str);
      } catch {
        return "";
      }
    };

    const jobTypeLabel = decodeSafe(params.get("jobtype") || "").trim();

    const jobTypeMap = {
      Fulltime: "fulltime",
      Parttime: "parttime",
      Contract: "contract",
      Freelance: "freelance",
      Internship: "internship",
    };

    const mappedJobType = jobTypeMap[jobTypeLabel] || "";

    setFormData((prev) => ({
      ...prev,
      requiredSkills: decodeSafe(params.get("skills") || ""),
      jobDescription: decodeSafe(params.get("job") || ""),
      yearsOfExperience: decodeSafe(params.get("yoe") || ""),
      jobTitle: decodeSafe(params.get("title") || ""),
      email: decodeSafe(params.get("mail") || ""),
      industry: decodeSafe(params.get("industry") || ""),
      jobType: mappedJobType,
    }));
  }, []);

  // Helper to strip HTML tags
  const stripHtml = (html) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    const blockTags = ["p", "div", "br", "li"];
    blockTags.forEach((tag) => {
      const elements = div.getElementsByTagName(tag);
      for (let el of elements) {
        el.appendChild(document.createTextNode(" "));
      }
    });
    return div.textContent || div.innerText || "";
  };

  // Restore orgId
  useEffect(() => {
    const storedId = localStorage.getItem("caseId");
    if (storedId) setOrgId(storedId);
  }, []);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ✅ Credits Handling
  const getDomainKey = (email) => {
    const rawDomain = email.split("@")[1]?.toLowerCase().trim();
    return {
      rawDomain,
      key: `${rawDomain.replace(/\./g, "_")}_credits`, // e.g. startitnow.com → startitnow_com_credits
    };
  };

  const handleNewSubmit = async (data) => {
    if (!data.jobTitle || !data.jobType || !data.jobDescription || !data.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (!data.resumeFiles?.length) {
      toast({
        title: "Missing Resume",
        description: "Please upload at least one resume before submitting.",
        variant: "destructive",
      });
      return;
    }

    try {
      // --- 1. Validate user email ---
      const validateRes = await fetch("/api/validateuser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });

      const validateData = await validateRes.json();

      if (validateRes.status !== 200 || validateData.status !== "success") {
        toast({
          title: "Unauthorized",
          description: validateData.message || "Unauthorized company domain",
          variant: "destructive",
        });
        return;
      }

      // --- 2. Handle credits per domain ---
      const { rawDomain, key } = getDomainKey(data.email);

      let credits = parseInt(localStorage.getItem(key), 10);

      if (isNaN(credits)) {
        credits = rawDomain === "startitnow.co.in" ? 500 : 100; // ✅ domain rule
        localStorage.setItem(key, credits);
      }

      if (credits < data.resumeFiles.length) {
        toast({
          title: "Insufficient Credits",
          description: "You only have ${credits} credits left.",
          variant: "destructive",
        });
        return;
      }

      // Deduct credits
      const updatedCredits = credits - data.resumeFiles.length;
      localStorage.setItem(key, updatedCredits);

      // --- 3. Submit job payload ---
      const form = new FormData();

      const jobPayload = {
        org_id: rawDomain === "startitnow.co.in" ? 3 : 2,
        job_title: data.jobTitle,
        exe_name: data.requiredSkills || "run 1",
        workflow_id: "resume_ranker",
        job_description: stripHtml(data.jobDescription),
      };

      console.log("Sending payload:", jobPayload);

      form.append("data", JSON.stringify(jobPayload));

      data.resumeFiles.forEach((file) => {
        if (file instanceof File) {
          form.append("resumes", file);
        }
      });

      const response = await fetch(
        "https://agentic-ai.co.in/api/agentic-ai/workflow-exe",
        {
          method: "POST",
          body: form,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Upload failed with status ${response.status}"
        );
      }

      console.log("✅ Response data:", result.data);

      if (result.data?.id) {
        setOrgId(result.data.id);
        localStorage.setItem("caseId", result.data.id);
      }

      localStorage.setItem("resumeResults", JSON.stringify(result.data));

      try {
      await fetch("/api/logToGoogleSheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          resumeCount: data.resumeFiles.length,
          caseId: result.data?.id || "N/A",
        }),
      });
    } catch (sheetError) {
      console.warn("⚠️ Failed to log to Google Sheets:", sheetError);
    }

      toast({
        title: "Success!",
        description: "✅ Resumes processed successfully. Remaining credits: ${updatedCredits}",
      });

      navigate("/resumes");
    } catch (error) {
      console.error("❌ Upload failed:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "❌ Something went wrong.",
        variant: "destructive",
      });
    }
  };

  const handleExistingSubmit = () => {
    setSubmittedExisting(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 relative overflow-hidden">
      <Helmet>
        <title>Talent Sift - Resume Screening Platform</title>
        <meta
          name="description"
          content="Create and post job opportunities with Talent Sift's intuitive job posting platform"
        />
      </Helmet>

      {/* Background floating blobs */}
      <motion.div
        className="absolute inset-0 opacity-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.1 }}
        transition={{ duration: 1 }}
      >
        <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-white rounded-full blur-xl animate-pulse delay-500"></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-white rounded-full blur-lg animate-pulse delay-1000"></div>
      </motion.div>

      <div className="relative z-10 min-h-screen flex flex-col ">
        <div className="p-8 flex items-center justify-start space-x-4">
          <img src={logo} alt="Talent Sift Logo" className="h-10" />
          <div className="absolute top-0 right-0 p-4 flex items-center justify-end space-x-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-blue font-bold">T</span>
            </div>
            <span className="text-2xl font-serif font-bold text-gray-800">
              Talent Sift
            </span>
          </div>
          <div className="absolute top-6 right-0 p-4 flex items-center justify-end space-x-2">
            <span className="text-s font-serif text-gray-500">Pro Version</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          {!submittedExisting ? (
            <JobFormStep1
              formData={formData}
              handleInputChange={handleInputChange}
              onNewSubmit={handleNewSubmit}
              onExistingSubmit={handleExistingSubmit}
            />
          ) : (
            <ResumeList />
          )}
        </div>

        <Toaster />
      </div>

      <div className="mt-8 ml-1 w-full">
        <Footer />
      </div>
    </div>
  );
}

export default App;
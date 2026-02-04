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
import axios from "axios";

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

  // ✅ helper: get source from URL
  const getSource = () => {
    const params = new URLSearchParams(window.location.search);
    return (params.get("source") || "").toLowerCase();
  };

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

  const getDomainKey = (email) => {
    const rawDomain = email.split("@")[1]?.toLowerCase().trim();
    return {
      rawDomain,
      key: `${rawDomain.replace(/\./g, "_")}_credits`,
    };
  };

  // ✅ MAIN SUBMIT
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

      let validateData = {};
      try {
        validateData = await validateRes.json();
      } catch {}

      if (!validateRes.ok || validateData.status !== "success") {
        toast({
          title: "Unauthorized",
          description: validateData.message || "Unauthorized company domain",
          variant: "destructive",
        });
        return;
      }

      // --- 2. Credits ---
      const { rawDomain, key } = getDomainKey(data.email);

      let credits = parseInt(localStorage.getItem(key), 10);

      if (isNaN(credits)) {
        credits = rawDomain === "startitnow.co.in" ? 500 : 100;
        localStorage.setItem(key, credits);
      }

      if (credits < data.resumeFiles.length) {
        toast({
          title: "Insufficient Credits",
          description: `You only have ${credits} credits left.`,
          variant: "destructive",
        });
        return;
      }

      const updatedCredits = credits - data.resumeFiles.length;
      localStorage.setItem(key, updatedCredits);

      // --- 3. Agentic AI Upload ---
      const form = new FormData();

      const jobPayload = {
        org_id: rawDomain === "startitnow.co.in" ? 3 : 2,
        job_title: data.jobTitle,
        exe_name: data.requiredSkills || "run 1",
        workflow_id: "resume_ranker",
        job_description: stripHtml(data.jobDescription),
      };

      form.append("data", JSON.stringify(jobPayload));

      data.resumeFiles.forEach((file) => {
        if (file instanceof File) form.append("resumes", file);
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
          result.message || `Upload failed with status ${response.status}`
        );
      }

      // ✅ store results locally
      if (result.data?.id) {
        setOrgId(result.data.id);
        localStorage.setItem("caseId", result.data.id);
      }

      localStorage.setItem("resumeResults", JSON.stringify(result.data));

      // ✅ 4. If source=servicenow → store in ServiceNow directly
      const source = getSource();

      if (source === "servicenow") {
        try {
          const snPayload = {
            case_id: result.data?.id || "",
            job_title: data.jobTitle,
            job_type: data.jobType,
            years_of_experience: data.yearsOfExperience,
            industry: data.industry,
            email: data.email,
            skills: data.requiredSkills,
            job_description: stripHtml(data.jobDescription),

            // ✅ Full AI JSON
            ai_results: result.data,
          };

          // ✅ Your Scripted REST API endpoint in ServiceNow
          const snRes = await axios.post(
            "https://dev303448.service-now.com/api/1852827/screening_results/POST",
            snPayload,
            {
              auth: {
                username: "admin",
                password: "n/$zULuUC37l",
              },
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
            }
          );

          console.log("✅ Stored in ServiceNow:", snRes.data);

          toast({
            title: "ServiceNow Updated",
            description: "✅ Results stored in ServiceNow successfully.",
          });
        } catch (snErr) {
          console.error("❌ ServiceNow storing failed:", snErr);

          toast({
            title: "ServiceNow Error",
            description:
              snErr.response?.data?.error?.message ||
              snErr.message ||
              "❌ Failed storing results in ServiceNow",
            variant: "destructive",
          });
        }
      }

      toast({
        title: "Success!",
        description: `✅ Resumes processed successfully. Remaining credits: ${updatedCredits}`,
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

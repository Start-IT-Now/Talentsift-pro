import React, { useState, useEffect } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import JobFormStep1 from '@/components/JobFormStep1';
import Footer from '@/components/Footer';
import logo from './logo.png';

function App() {
  const [formData, setFormData] = useState({
    jobTitle: '',
    yearsOfExperience: '',
    jobType: '',
    industry: '',
    requiredSkills: '',
    jobDescription: '',
    resumeFiles: [],
    source: '',
  });

  const { toast } = useToast();
   const navigate = useNavigate();

  // Auto-populate from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const decodeSafe = (str) => {
      try {
        return decodeURIComponent(str);
      } catch {
        return '';
      }
    };

    setFormData(prev => ({
      ...prev,
      requiredSkills: decodeSafe(params.get('skills') || ''),
      jobDescription: decodeSafe(params.get('job') || ''),
      yearsOfExperience: decodeSafe(params.get('yoe') || ''),
      jobTitle: decodeSafe(params.get('title') || ''),
      jobtype: decodeSafe(params.get('jobtype') || ''),
    }));
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const stripHtml = (html) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    const blockTags = ['p', 'div', 'br', 'li'];
    blockTags.forEach(tag => {
      const elements = div.getElementsByTagName(tag);
      for (let el of elements) {
        el.appendChild(document.createTextNode(' '));
      }
    });
    return (div.textContent || div.innerText || '').trim();
  };

 const handleSubmit = async () => {
  if (!formData.jobTitle || !formData.jobType || !formData.jobDescription) {
    toast({
      title: "Missing Information",
      description: "Please fill in all required fields before submitting.",
      variant: "destructive"
    });
    return;
  }

  if (!formData.resumeFiles || formData.resumeFiles.length === 0) {
    toast({
      title: "Missing Resume",
      description: "Please upload at least one resume before submitting.",
      variant: "destructive"
    });
    return;
  }

  try {
    const form = new FormData();
    const orgIdFromStorage = Number(localStorage.getItem("orgId") || 1);

    const jobPayload = {
      org_id: orgIdFromStorage,
      exe_name: formData.requiredSkills,
      workflow_id: "resume_ranker",
      job_description: stripHtml(formData.jobDescription) || "No description",
      source: formData.source || "",
    };

    form.append("data", JSON.stringify(jobPayload));

    const files = Array.isArray(formData.resumeFiles) ? formData.resumeFiles : [formData.resumeFiles];
    files.forEach(file => {
      if (file instanceof File) form.append("resumes", file);
    });

    const response = await fetch(
      "https://agentic-ai.co.in/api/agentic-ai/workflow-exe",
      { method: "POST", body: form }
    );

    let result;
    try {
      result = await response.json();
    } catch {
      throw new Error("Server did not return JSON");
    }

    if (!response.ok) {
      throw new Error(result.message || `Upload failed with status ${response.status}`);
    }

    // ✅ Save to localStorage for ResumeList
      localStorage.setItem("resumeResults", JSON.stringify(result.data));

    // ✅ Redirect to ResumeList
    navigate("/resumes");

    toast({
      title: "Success",
      description: "Job submitted and resumes processed successfully.",
      variant: "default",
    });

  } catch (error) {
    console.error(error);
    toast({
      title: "Submission Error",
      description: error.message || "An unexpected error occurred",
      variant: "destructive",
    });
  }
};


  return (
    <HelmetProvider>
      <div className="min-h-screen bg-gray-100 relative overflow-hidden">
        <Helmet>
          <title>Talent Sift - Resume Screening Lite</title>
          <meta
            name="description"
            content="Create and post job opportunities with Talent Sift's intuitive job posting platform"
          />
        </Helmet>

        {/* Background animation */}
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

        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Logo/Header */}
          <div className="p-8">
            <img src={logo} alt="Talent Sift Logo" className="h-10" />
          </div>
          <div>
            <span className="absolute top-2 right-2 text-2xl font-serif font-bold text-gray-800">Talent Sift</span>
          </div>
          <div className="absolute top-6 right-0 p-4 flex items-center justify-end space-x-2">
            <span className="text-s font-serif text-gray-500">Lite Version</span>
          </div>

          {/* Job Form */}
          <div className="flex-1 flex items-center justify-center p-4">
            <JobFormStep1
              formData={formData}
              handleInputChange={handleInputChange}
              handleSubmit={handleSubmit}
            />
          </div>

          <Toaster />
        </div>
              {/* Footer */}
          <div className="mt-8 ml-1 w-full">
            <Footer />
          </div>
      </div>
    </HelmetProvider>
  );
}

export default App;

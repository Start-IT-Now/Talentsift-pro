import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {Briefcase, Clock, Star, FileText, Users} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ResumeMultiDropzone from '@/components/ResumeMultiDropzone';
import pic from '../pic.png';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const FloatingIcon = ({ children, className }) => (
  <motion.div
    className={`absolute bg-white/20 backdrop-blur-sm p-3 rounded-full shadow-lg ${className}`}
    initial={{ y: 0, opacity: 0, scale: 0.5 }}
    animate={{ y: [0, -10, 0], opacity: 1, scale: 1 }}
    transition={{ duration: 3, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }}
  >
    {children}
  </motion.div>
);

const JobDescriptionEditor = ({ value, onChange }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-[200px] bg-white/70 border border-gray-300 rounded-md p-2">Loading editor...</div>;
  }

  return (
    <ReactQuill
      theme="snow"
      value={value}
      onChange={onChange}
      modules={{
        toolbar: [
          ['bold', 'italic', 'underline'],
          [{ header: [1, 2, 3, false] }],
          ['clean'],
        ],
      }}
      formats={['bold', 'italic', 'underline', 'header']}
      placeholder="Describe the role, responsibilities, requirements, etc..."
      className="bg-white/70 border border-gray-300 rounded-md min-h-[200px]"
    />
  );
};

const JobFormStep1 = ({ formData, handleInputChange, handleSubmit }) => {
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

 const validate = () => {
  const newErrors = {};

  if (!formData.jobTitle) newErrors.jobTitle = "Job Title is required";
  if (!formData.jobType) newErrors.jobType = "Job Type is required";
  if (!formData.requiredSkills) newErrors.requiredSkills = "Key skills are required";

  if (!formData.jobDescription || formData.jobDescription.trim().length === 0) {
    newErrors.jobDescription = "Job description is required";
  }

  // ✅ Resume validation separate
  if (!formData.resumeFiles || formData.resumeFiles.length === 0) {
    newErrors.resumeFiles = "At least one resume must be uploaded";
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

  const onSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      const skillsArray = formData.requiredSkills
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean);
      localStorage.setItem('requiredSkills', JSON.stringify(skillsArray));
      await handleSubmit(formData);  // <-- NO argument here
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        {isLoading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-md">
            <div className="text-lg font-semibold text-blue-600 animate-pulse">Processing...</div>
          </div>
        )}
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="w-full max-w-6xl flex flex-col lg:flex-row items-center justify-center gap-24 mx-auto px-4 py-8">
          {/* Left side illustration */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.6 }}
            className="flex-1 flex items-center justify-center mb-8 lg:mb-0"
          >
            <div className="relative w-full max-w-6xl mx-auto">
              <div className="mb-6 text-center max-w-3xl mx-auto px-4">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-orange-400">
                  <span className='text-orange-400'>Resume Ranking</span><br />
                  <span>for Perfect Matches</span>
                </h1>
                <p className="mt-4 text-base md:text-lg text-gray-800">
                  Our AI-powered tool compares resumes to job descriptions, finding you the best candidates and saving hours of screening time.
                </p>
              </div>

              <FloatingIcon className="top-10 -left-8 text-blue-500">
                <Briefcase size={24} />
              </FloatingIcon>
              <FloatingIcon className="bottom-16 -right-8 text-green-500">
                <Star size={24} />
              </FloatingIcon>

              <motion.img
                src={pic}
                alt="Team working"
                className="w-full h-auto rounded-3xl shadow-2xl object-cover"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.05, y: -10, transition: { duration: 0.4 } }}
                transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </motion.div>

          {/* Right side form */}
          <motion.div layout className="flex-1 w-full max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-gray-100 backdrop-blur-lg rounded-3xl shadow-2xl p-8"
            >
              <div className="flex items-center justify-start mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">T</span>
                  </div>
                  <span className="text-xl font-bold text-gray-800">TALENT SIFT</span>
                </div>
              </div>

              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-6">

                {/* Job Title + Experience */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-slate-800 font-semibold">
                      <Briefcase className="w-4 h-4" />
                      Job Title <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="e.g. Senior Frontend Developer"
                      value={formData.jobTitle}
                      onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                      className="bg-white/70 border-gray-300"
                    />
                    {errors.jobTitle && <p className="text-red-600 text-sm">{errors.jobTitle}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-slate-800 font-semibold">
                      <Clock className="w-4 h-4" />
                      Years of Experience
                    </Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="e.g. 3"
                      value={formData.yearsOfExperience}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^\d*$/.test(value)) {
                          const numericValue = Number(value);
                          if (value === '' || (numericValue >= 0 && numericValue <= 30)) {
                            handleInputChange('yearsOfExperience', value);
                          }
                        }
                      }}
                      onWheel={(e) => e.target.blur()}
                      className="bg-white/70 border-gray-300"
                    />
                  </div>
                </div>

                {/* Job Type + Skills */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-slate-800 font-semibold">
                      <Briefcase className="w-4 h-4" />
                      Job Type <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="e.g. Fulltime, Part-time, Contract"
                      value={formData.jobType}
                      onChange={(e) => handleInputChange('jobType', e.target.value)}
                      className="bg-white/70 border-gray-300"
                    />
                    {errors.jobType && <p className="text-red-600 text-sm">{errors.jobType}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-slate-800 font-semibold">
                      Key Skills <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="e.g. JAVA, REACT"
                      value={formData.requiredSkills}
                      onChange={(e) => handleInputChange('requiredSkills', e.target.value)}
                      className="bg-white/70 border-gray-300"
                      disabled={isLoading}
                    />
                    {errors.requiredSkills && <p className="text-red-600 text-sm">{errors.requiredSkills}</p>}
                  </div>
                </div>

                {/* Resume Upload */}
                <ResumeMultiDropzone
                  onFilesSelected={(files) => handleInputChange('resumeFiles', files)}
                  defaultFiles={formData.resumeFiles}
                  disabled={isLoading}
                />
                {errors.resumeFiles && <p className="text-red-600 text-sm">{errors.resumeFiles}</p>}

                {/* Job Description */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-slate-800 font-semibold">
                    <FileText className="w-4 h-4" />
                    Job Description <span className="text-red-500">*</span>
                  </Label>
                  <JobDescriptionEditor
                    value={formData.jobDescription}
                    onChange={(value) => handleInputChange('jobDescription', value)}
                  />
                  {errors.jobDescription && <p className="text-red-600 text-sm">{errors.jobDescription}</p>}
                </div>

                {/* Submit */}
                <div className="flex justify-end pt-6">
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Processing...' : 'Submit'}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </form>
      </main>
    </div>
  );
};

export default JobFormStep1;

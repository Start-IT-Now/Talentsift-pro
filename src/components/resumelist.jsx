import React, { useState, useEffect, useMemo } from 'react'; 
import { motion } from 'framer-motion';
import { Range } from 'react-range';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';  // <-- Import useNavigate
import Footer from './Footer'; // Ensure Footer is imported

const getRankLabel = (score) => {
  // You can fill this function with labels for scores if needed
};

const ResumeList = () => {
  const navigate = useNavigate(); // <-- Initialize navigate hook

  const [resumes, setResumes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [scoreRange, setScoreRange] = useState([1, 10]);
  const [experienceRange, setExperienceRange] = useState([0, 35]);
  const [filterEmail, setFilterEmail] = useState(false);
  const [filterPhone, setFilterPhone] = useState(false);
  const [userKeySkills, setUserKeySkills] = useState([]);
  const [orgId, setOrgId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [caseId, setCaseId] = useState(null);
  const [updatedCredits, setUpdatedCredits] = useState(null);

  useEffect(() => {
    try {
      const storedSkills = localStorage.getItem("keySkills");
      const parsedSkills = storedSkills ? JSON.parse(storedSkills) : [];
      setUserKeySkills(Array.isArray(parsedSkills) ? parsedSkills : []);

      const storedResumes = localStorage.getItem("resumeResults");
const parsedResumes = storedResumes ? JSON.parse(storedResumes) : null;

if (parsedResumes && Array.isArray(parsedResumes.result)) {
  const mapped = parsedResumes.result.map((item, index) => ({
    orgId: parsedResumes.id,
    exeName: parsedResumes.exe_name,
    candidateId: index + 1,
    name: item.name || `Candidate ${index + 1}`,
    Rank: item.score || 0,
    justification: item.justification || "",
    experience: typeof item.experience === "number" ? item.experience : 0,
    email: item.email === "xxx" || !item.email ? "No email" : item.email,
    phone: item.phone === "xxx" || !item.phone ? "No phone" : item.phone,
  }));

  setResumes(mapped);
  setCaseId(parsedResumes.id);
}
 
    } catch (err) {
      console.error("Error loading or parsing data:", err);
    }
  }, []);

  useEffect(() => {
    if (resumes.length > 0) {
      console.log("Resumes state:", resumes);
      console.log("Org ID:", orgId);
    }
  }, [resumes, orgId]);

 useEffect(() => {
  try {
    const storedResumes = JSON.parse(localStorage.getItem("resumeResults"));

    let domain = null;

    // Try to get domain from resumeResults.email
    if (storedResumes?.email) {
      domain = storedResumes.email.split("@")[1]?.toLowerCase();
    }

    // Or fallback to a manually hardcoded email
    if (!domain) {
      const fallbackEmail = localStorage.getItem("formEmail") || "user@startitnow.co.in";
      domain = fallbackEmail.split("@")[1]?.toLowerCase();
    }

    if (domain) {
      const key = `${domain.replace(/\./g, "_")}_credits`;
      const credits = parseInt(localStorage.getItem(key), 10);

      console.log("🟠 Looking for credits using key:", key, "→", credits);

      if (!isNaN(credits)) {
        setUpdatedCredits(credits);
      }
    }
  } catch (err) {
    console.error("Error fetching credits:", err);
  }
}, []);

//   const handleShortlist = async (candidate) => {
//   try {
//     const res = await fetch("/api/send-email", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         name: candidate.name,
//         email: candidate.email,
//         phone: candidate.phone,
//         experience: candidate.experience,
//         score: candidate.score,
//         description: candidate.summary, // candidate summary
//       }),
//     });

//     const data = await res.json();
//     if (res.ok) {
//       alert(`Candidate ${candidate.name} sent to QNTRL.`);
//     } else {
//       alert(`Failed: ${data.error}`);
//     }
//   } catch (err) {
//     console.error(err);
//     alert("Error sending email.");
//   }
// };


  const filteredResumes = useMemo(() => {
  const query = searchQuery.toLowerCase().trim();

  return resumes.filter((resume) => {
    const rank = Number(resume.Rank) || 0;

    const matchesSearch =
      resume.name.toLowerCase().includes(query) ||
      (resume.email && resume.email.toLowerCase().includes(query)) ||
      (resume.justification && resume.justification.toLowerCase().includes(query));

    const inScoreRange = rank >= scoreRange[0] && rank <= scoreRange[1];
    const inExperienceRange =
      resume.experience >= experienceRange[0] && resume.experience <= experienceRange[1];

    const hasEmail = filterEmail ? (resume.email && resume.email !== 'No email') : true;
    const hasPhone = filterPhone ? (resume.phone && resume.phone !== 'No phone') : true;

    return matchesSearch && inScoreRange && inExperienceRange && hasEmail && hasPhone;
  });
}, [searchQuery, scoreRange, experienceRange, filterEmail, filterPhone, resumes]);

  const renderThumb = ({ index, props }) => (
    <div {...props} key={index} className="h-5 w-5 rounded-full bg-blue-600 shadow-md cursor-pointer" />
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 flex justify-center items-start">

      <div className="bg-white/80 backdrop-blur-md shadow-lg rounded-xl w-full max-w-6xl p-4 sm:p-6 flex flex-col md:flex-row gap-6 md:gap-8">

        {/* Sidebar */}
        <div className="w-full md:w-64 bg-gray-100 rounded-xl p-4 sm:p-6 shadow-md flex flex-col flex-shrink-0">
          <h3 className="font-bold text-blue-900 mb-5 text-xl">🔍 Filter Options</h3>

          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-6 px-4 py-3 rounded-lg border border-blue-300 focus:outline-none text-gray-700"
          />

         {/* Key Skills */}
          <div>
            <h3 className="font-bold text-blue-900 mt-3 mb-3 text-xl">🛠️ Key Skills</h3>
            <div className="text-sm bg-white border border-blue-200 rounded-md p-3 text-blue-900 shadow-inner min-h-[40px] mb-4">
              {userKeySkills.length > 0 ? userKeySkills.join(', ') : 'No key skills available'}
            </div>
          </div>

          {/* Score Range */}
          <label className="font-semibold text-blue-800 mb-3 block text-lg">Score Range</label>
          <div className="flex justify-between mb-3 text-blue-900 font-semibold text-sm">
            <span>{scoreRange[0]}</span><span>{scoreRange[1]}</span>
          </div>
          <Range
            step={1}
            min={1}
            max={10}
            values={scoreRange}
            onChange={setScoreRange}
            renderTrack={({ props, children }) => (
              <div {...props} style={{ ...props.style, height: '6px', backgroundColor: '#ddd' }}>
                <div
                  style={{
                    height: '6px',
                    backgroundColor: '#2563eb',
                    marginLeft: `${((scoreRange[0] - 1) / 9) * 100}%`,
                    width: `${((scoreRange[1] - scoreRange[0]) / 9) * 100}%`,
                  }}
                />
                {children}
              </div>
            )}
            renderThumb={(props) => renderThumb(props, scoreRange)}
          />

          <label className="font-semibold text-blue-800 mt-6 mb-3 block text-lg">Experience (years)</label>
          <div className="flex justify-between mb-3 text-blue-900 font-semibold text-sm">
            <span>{experienceRange[0]}</span>
            <span>{experienceRange[1]}</span>
          </div>
          <Range
            step={1}
            min={0}
            max={35} // max experience set to 50 years
            values={experienceRange}
            onChange={setExperienceRange}
            renderTrack={({ props, children }) => (
              <div {...props} style={{ ...props.style, height: '6px', background: '#ddd' }}>
                <div
                  style={{
                    height: '6px',
                    width: `${((experienceRange[1] - experienceRange[0]) / 35) * 100}%`,
                    backgroundColor: '#2563eb',
                    marginLeft: `${(experienceRange[0] / 35) * 100}%`,
                  }}
                />
                {children}
              </div>
            )}
            renderThumb={renderThumb}
          />

          {/* Email & Phone Filters */}
          <div className="mt-6 flex flex-row gap-x-6">
            <label className="inline-flex items-center gap-2 text-blue-900 font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={filterEmail}
                onChange={() => setFilterEmail(!filterEmail)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Email
            </label>
            <label className="inline-flex items-center gap-2 text-blue-900 font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={filterPhone}
                onChange={() => setFilterPhone(!filterPhone)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Phone
            </label>
          </div>
        </div>

        {/* Resume Results */}
        <motion.div layout className="flex-1 space-y-6 overflow-auto max-h-[80vh]">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-3xl font-semibold text-blue-900">📄 Talent Sift</h2>

   {/* ✅ Floating Case ID + Remaining Credits */}
<div className="flex items-center justify-between mb-4 gap-4">
  {caseId && (
    <div className="bg-orange-400 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50">
      Case ID: {caseId}
    </div>
  )}

{updatedCredits !== null && (
  <div className="bg-orange-400 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50">
    Remaining Credits: {updatedCredits}
  </div>
)}
</div>
          </div>

          {/* Back button */}
          <div className="w-full max-w-6xl mb-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Home
            </button>
          </div>

          <div className="flex justify-between items-center mb-4">
            <p className="text-blue-800 font-medium mb-4">
              Showing <span className="font-bold">{filteredResumes.length}</span> of{' '}
              <span className="font-bold">{resumes.length}</span> resumes
            </p>

            <p className="text-blue-800 font-medium">
              <span className="font-bold"></span> Score Range 1 - 10
            </p>
          </div>

          <ul className="space-y-4">
            {filteredResumes.length === 0 ? (
              <li className="text-blue-900 italic font-medium">No resumes found.</li>
            ) : (
              filteredResumes.map((resume) => (
                <motion.li
                  layout
                  key={resume.id}
                  className="bg-white rounded-2xl shadow-md p-5 flex flex-col gap-3 border border-blue-200"
                >
                  <div className="text-gray-900 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 w-full">
                    
                    <div className="text-2xl font-bold text-blue-900">{resume.name}</div> 
                    <div className="text-blue-900 font-semibold">Score: {resume.Rank} {getRankLabel(resume.Rank)}</div>
                    <div className="text-blue-900 font-semibold">Experience: {resume.experience ? `${resume.experience} yrs` : 'null'}</div>
                    <div className="text-blue-700 font-semibold">{resume.phone || 'No phone'}</div>
                    <div className="text-blue-700 font-semibold">{resume.email || 'No email'}</div>
                  </div>
{/* <button
  onClick={() => handleShortlist(resume)}  // Pass the candidate here
  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
>
  Shortlist
</button> */}

                  <div className="text-gray-800 mt-2 text-sm whitespace-pre-line">
                    {resume.justification}
                  </div>

                </motion.li>
              ))
            )}
          </ul>
        </motion.div>
      </div>
    </div>
  );
};

export default ResumeList;
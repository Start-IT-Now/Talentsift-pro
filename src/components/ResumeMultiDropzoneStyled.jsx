import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, CheckCircle, Trash2 } from 'lucide-react';

const ResumeMultiDropzone = ({ onFilesSelected, defaultFiles = [] }) => {
  const [files, setFiles] = useState(defaultFiles);
  const [error, setError] = useState('');

  const MAX_SIZE = 2 * 1024 * 1024; 

  const onDrop = useCallback((acceptedFiles, fileRejections) => {
    setError('');

    if (fileRejections.length > 0) {
      const rejectedFile = fileRejections[0];
      if (rejectedFile.errors.some(e => e.code === 'file-too-large')) {
        setError('One or more files exceed 2MB. Please upload smaller files.');
      } else if (rejectedFile.errors.some(e => e.code === 'file-invalid-type')) {
        setError('Invalid file type. Only PDF and DOCX files are allowed.');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      const newFiles = [...files, ...acceptedFiles];
      setFiles(newFiles);
      onFilesSelected(newFiles); 
    }
  }, [files, onFilesSelected]);

  const removeFile = (fileToRemove) => {
    const updatedFiles = files.filter(file => file !== fileToRemove);
    setFiles(updatedFiles);
    onFilesSelected(updatedFiles); 
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: MAX_SIZE,
    multiple: true, 
  });

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-slate-800 font-semibold">
        <FileText className="w-4 h-4" />
        Upload Resumes <span className="text-red-500">*</span>
      </label>

      <div
        {...getRootProps()}
        role="button"
        tabIndex={0}
        aria-label="Resume upload area"
        className={`rounded-lg border-2 border-dashed p-4 text-center transition bg-white/70 min-h-[100px] flex items-center justify-center ${
          isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
        }`}
      >
        <input {...getInputProps()} />
        {files.length === 0 ? (
          <div className="space-y-1">
            <p className="text-sm text-gray-600">Drag & drop resumes here, or click to select.</p>
            <p className="text-sm text-gray-600">PDF or DOCX only. Max 2MB per file.</p>
          </div>
        ) : (
          <div className="w-full space-y-2">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between border rounded px-3 py-1 bg-green-50"
              >
                <p className="text-sm text-green-700 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {file.name}
                </p>
                <button
                  type="button"
                  onClick={() => removeFile(file)}
                  className="text-red-500 text-xs flex items-center gap-1 hover:underline"
                >
                  <Trash2 className="w-3 h-3" />
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

export default ResumeMultiDropzone;
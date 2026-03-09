import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { Upload, Link as LinkIcon } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { examplePapers, getOrCreateVideoId } from "../lib/data";

export default function Home() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
      setUrl("");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUrl("");
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    if (e.target.value) {
      setFile(null);
    }
  };

  const handleGenerate = () => {
    // For demo, use the first example paper
    const paperId = examplePapers[0].id;
    const jobId = getOrCreateVideoId(paperId);
    navigate(`/video/${jobId}?paperId=${paperId}`);
  };

  const handleExampleClick = (paperId: string) => {
    const jobId = getOrCreateVideoId(paperId);
    navigate(`/video/${jobId}?paperId=${paperId}`);
  };

  const canGenerate = file || url.length > 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>
      {/* Top bar */}
      <div className="border-b border-[#E5E7EB] bg-white">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div style={{ fontFamily: "'Instrument Serif', serif" }} className="text-2xl">
            PaperVideo
          </div>
          <button className="text-[#6B7280] hover:text-[#1A1A1A] transition-colors">
            Sign In
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-8 pt-32 pb-16">
        {/* Headline */}
        <h1 
          className="text-center mb-16"
          style={{ 
            fontFamily: "'Instrument Serif', serif",
            fontSize: '60px',
            letterSpacing: '-1px',
            color: '#1A1A1A',
            fontWeight: 400
          }}
        >
          Drop a paper. Get a video.
        </h1>

        {/* Drop zone */}
        <div
          className="relative mb-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer"
          style={{
            borderColor: isDragging ? '#2563EB' : '#E5E7EB',
            backgroundColor: isDragging ? 'rgba(37, 99, 235, 0.05)' : '#FFFFFF',
            minHeight: '200px'
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center justify-center py-12 px-8">
            <Upload 
              className="mb-4" 
              size={48} 
              style={{ color: file ? '#2563EB' : '#9CA3AF' }}
            />
            <div className="text-center">
              {file ? (
                <>
                  <p style={{ color: '#1A1A1A' }} className="mb-2">
                    {file.name}
                  </p>
                  <p style={{ color: '#6B7280' }} className="text-sm">
                    Click to change file
                  </p>
                </>
              ) : (
                <>
                  <p style={{ color: '#1A1A1A' }} className="mb-2">
                    Drop a PDF here or click to browse
                  </p>
                  <p style={{ color: '#6B7280' }} className="text-sm">
                    PDF files up to 50 pages
                  </p>
                </>
              )}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* URL input */}
        <div className="mb-8">
          <div className="relative">
            <LinkIcon 
              className="absolute left-4 top-1/2 -translate-y-1/2" 
              size={20}
              style={{ color: '#9CA3AF' }}
            />
            <Input
              type="text"
              placeholder="Or paste arXiv URL or DOI"
              value={url}
              onChange={handleUrlChange}
              className="pl-12 h-14 rounded-xl border-[#E5E7EB] bg-white"
              style={{ fontSize: '16px' }}
            />
          </div>
        </div>

        {/* Generate button */}
        <Button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="w-full h-14 rounded-xl text-base"
          style={{
            backgroundColor: canGenerate ? '#2563EB' : '#E5E7EB',
            color: canGenerate ? '#FFFFFF' : '#9CA3AF',
            fontWeight: 500
          }}
        >
          Generate Video
        </Button>

        {/* Example papers */}
        <div className="mt-12 text-center">
          <p style={{ color: '#6B7280' }} className="mb-4">
            Try it with:
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {examplePapers.map((paper) => (
              <button
                key={paper.id}
                onClick={() => handleExampleClick(paper.id)}
                className="px-4 py-2 rounded-lg border transition-all hover:border-[#2563EB] hover:bg-white"
                style={{
                  borderColor: '#E5E7EB',
                  color: '#1A1A1A',
                  backgroundColor: '#FFFFFF'
                }}
              >
                {paper.title}
              </button>
            ))}
          </div>
        </div>

        {/* Info text */}
        <p className="mt-8 text-center text-sm" style={{ color: '#9CA3AF' }}>
          PDF, arXiv URL, or DOI. Up to 50 pages. Takes about 2-3 minutes.
        </p>
      </div>

      {/* Below fold - sample video section */}
      <div className="max-w-4xl mx-auto px-8 py-16">
        <div className="bg-white rounded-2xl p-8 border border-[#E5E7EB]">
          <h2 
            className="text-center mb-8"
            style={{ 
              fontFamily: "'Inter', sans-serif",
              fontSize: '38px',
              letterSpacing: '-0.5px',
              color: '#1A1A1A',
              fontWeight: 600
            }}
          >
            How it works
          </h2>
          
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex gap-4 items-start">
              <div 
                className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: '#2563EB', fontWeight: 500 }}
              >
                1
              </div>
              <div className="pt-2">
                <p style={{ color: '#1A1A1A' }}>
                  <strong>We read the paper</strong> — Extracting text, figures, tables, and equations
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div 
                className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: '#2563EB', fontWeight: 500 }}
              >
                2
              </div>
              <div className="pt-2">
                <p style={{ color: '#1A1A1A' }}>
                  <strong>AI extracts key findings</strong> — Identifying main contributions, results, and insights
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div 
                className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: '#2563EB', fontWeight: 500 }}
              >
                3
              </div>
              <div className="pt-2">
                <p style={{ color: '#1A1A1A' }}>
                  <strong>You get a narrated walkthrough</strong> — A clean video explaining the paper in minutes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import { mockPaperData, processingStages, saveVideoToLibrary } from "../lib/data";

export default function Processing() {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [searchParams] = useSearchParams();
  const paperId = searchParams.get("paperId") || "attention";
  
  const [currentStage, setCurrentStage] = useState(0);
  const [scenePlan, setScenePlan] = useState<any[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(120);

  const paperData = mockPaperData[paperId];

  useEffect(() => {
    // Simulate processing stages
    const stageTimers: NodeJS.Timeout[] = [];
    
    // Stage 1: Extract (0-30s)
    stageTimers.push(setTimeout(() => setCurrentStage(1), 3000));
    
    // Stage 2: Plan (30-60s) - show scene plan
    stageTimers.push(setTimeout(() => {
      setCurrentStage(2);
      setScenePlan(paperData.scenes || []);
    }, 8000));
    
    // Stage 3: Visuals (60-90s)
    stageTimers.push(setTimeout(() => setCurrentStage(3), 15000));
    
    // Stage 4: Narration (90-105s)
    stageTimers.push(setTimeout(() => setCurrentStage(4), 22000));
    
    // Stage 5: Assemble (105-120s)
    stageTimers.push(setTimeout(() => setCurrentStage(5), 28000));
    
    // Complete - navigate to viewer
    stageTimers.push(setTimeout(() => {
      // Save to library
      saveVideoToLibrary(jobId!, paperData);
      navigate(`/v/${jobId}`);
    }, 32000));

    // Time remaining countdown
    const countdownInterval = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      stageTimers.forEach(timer => clearTimeout(timer));
      clearInterval(countdownInterval);
    };
  }, [jobId, paperId, navigate, paperData]);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>
      {/* Top bar */}
      <div className="border-b border-[#E5E7EB] bg-white">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div style={{ fontFamily: "'Instrument Serif', serif" }} className="text-2xl">
            PaperVideo
          </div>
          <button 
            onClick={() => navigate('/')}
            className="text-[#6B7280] hover:text-[#1A1A1A] transition-colors flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            New Video
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left column - Paper info */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-8 border border-[#E5E7EB]">
              <h2 
                className="mb-4"
                style={{ 
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '24px',
                  color: '#1A1A1A',
                  fontWeight: 600
                }}
              >
                {paperData.title}
              </h2>
              
              <p className="mb-4 text-sm" style={{ color: '#6B7280' }}>
                {paperData.authors.join(", ")}
              </p>
              
              <p className="mb-4 text-sm" style={{ color: '#6B7280' }}>
                {paperData.venue} · {paperData.year}
              </p>

              <div className="pt-4 border-t border-[#E5E7EB]">
                <h3 className="mb-2" style={{ color: '#1A1A1A', fontWeight: 500 }}>
                  Abstract
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>
                  {paperData.abstract}
                </p>
              </div>
            </div>
          </div>

          {/* Right column - Progress */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl p-8 border border-[#E5E7EB]">
              <h2 
                className="mb-2"
                style={{ 
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '24px',
                  color: '#1A1A1A',
                  fontWeight: 600
                }}
              >
                Generating your video
              </h2>
              
              <p className="mb-8 text-sm" style={{ color: '#6B7280' }}>
                About {minutes}:{seconds.toString().padStart(2, '0')} remaining
              </p>

              {/* Progress stepper */}
              <div className="space-y-6 mb-12">
                {processingStages.map((stage, index) => {
                  const isComplete = index < currentStage;
                  const isCurrent = index === currentStage;
                  const isPending = index > currentStage;

                  return (
                    <div key={stage.id} className="flex gap-4 items-start">
                      <div className="flex-shrink-0 mt-1">
                        {isComplete && (
                          <CheckCircle2 size={24} style={{ color: '#059669' }} />
                        )}
                        {isCurrent && (
                          <Loader2 size={24} style={{ color: '#2563EB' }} className="animate-spin" />
                        )}
                        {isPending && (
                          <div 
                            className="w-6 h-6 rounded-full border-2"
                            style={{ borderColor: '#E5E7EB' }}
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <p 
                          style={{ 
                            color: isComplete || isCurrent ? '#1A1A1A' : '#9CA3AF',
                            fontWeight: 500
                          }}
                        >
                          {stage.label}
                        </p>
                        <p 
                          className="text-sm"
                          style={{ color: isComplete || isCurrent ? '#6B7280' : '#9CA3AF' }}
                        >
                          {stage.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Scene plan preview */}
              {scenePlan.length > 0 && (
                <div className="pt-8 border-t border-[#E5E7EB]">
                  <h3 
                    className="mb-4"
                    style={{ 
                      color: '#1A1A1A',
                      fontWeight: 600
                    }}
                  >
                    Scene Plan
                  </h3>
                  <div className="space-y-3">
                    {scenePlan.map((scene) => (
                      <div 
                        key={scene.id}
                        className="flex gap-3 items-start p-3 rounded-lg"
                        style={{ backgroundColor: '#F4F4F0' }}
                      >
                        <div 
                          className="flex-shrink-0 w-8 h-8 rounded flex items-center justify-center text-sm"
                          style={{ 
                            backgroundColor: '#2563EB',
                            color: '#FFFFFF',
                            fontWeight: 500
                          }}
                        >
                          {scene.id}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p style={{ color: '#1A1A1A', fontWeight: 500 }} className="text-sm">
                            {scene.label}
                          </p>
                          <p style={{ color: '#6B7280' }} className="text-xs">
                            {scene.type.replace('_', ' ')} · {scene.duration}s
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

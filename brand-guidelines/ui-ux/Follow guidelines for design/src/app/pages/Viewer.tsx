import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { 
  Play, 
  Pause, 
  Volume2, 
  Maximize, 
  ChevronLeft, 
  ChevronRight,
  ExternalLink,
  Share2,
  Download,
  RefreshCw,
  StickyNote,
  FileText,
  X,
  Trash2,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { getVideoById, incrementViewCount, getNotes, saveNote, deleteNote } from "../lib/data";
import { Textarea } from "../components/ui/textarea";

export default function Viewer() {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<"paper" | "notes">("paper");
  const [notes, setNotes] = useState<any[]>([]);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");
  const [showSceneBreakdown, setShowSceneBreakdown] = useState(false);

  const video = getVideoById(videoId!);

  useEffect(() => {
    if (videoId) {
      incrementViewCount(videoId);
      setNotes(getNotes(videoId));
    }
  }, [videoId]);

  useEffect(() => {
    // Simulate video playback
    let interval: NodeJS.Timeout;
    if (isPlaying && video) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const next = prev + (1 * playbackSpeed);
          if (next >= video.duration) {
            setIsPlaying(false);
            return video.duration;
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, video]);

  useEffect(() => {
    // Update current scene based on time
    if (video?.scenes) {
      let accumulatedTime = 0;
      for (let i = 0; i < video.scenes.length; i++) {
        accumulatedTime += video.scenes[i].duration;
        if (currentTime < accumulatedTime) {
          setCurrentSceneIndex(i);
          break;
        }
      }
    }
  }, [currentTime, video]);

  if (!video) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAFAF8' }}>
        <div className="text-center">
          <p style={{ color: '#1A1A1A' }} className="mb-4">Video not found</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSceneClick = (index: number) => {
    let time = 0;
    for (let i = 0; i < index; i++) {
      time += video.scenes[i].duration;
    }
    setCurrentTime(time);
    setCurrentSceneIndex(index);
  };

  const handlePreviousScene = () => {
    if (currentSceneIndex > 0) {
      handleSceneClick(currentSceneIndex - 1);
    }
  };

  const handleNextScene = () => {
    if (currentSceneIndex < video.scenes.length - 1) {
      handleSceneClick(currentSceneIndex + 1);
    }
  };

  const handleAddNote = () => {
    if (newNoteText.trim()) {
      saveNote(videoId!, {
        timestamp: currentTime,
        text: newNoteText
      });
      setNotes(getNotes(videoId!));
      setNewNoteText("");
      setIsAddingNote(false);
    }
  };

  const handleDeleteNote = (noteId: string) => {
    deleteNote(videoId!, noteId);
    setNotes(getNotes(videoId!));
  };

  const handleNoteClick = (timestamp: number) => {
    setCurrentTime(timestamp);
    setIsPlaying(false);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (currentTime / video.duration) * 100;

  const currentScene = video.scenes[currentSceneIndex];
  const currentSection = video.sections?.find(
    (s: any) => s.id === currentScene?.sectionId
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
        return;
      }

      switch(e.key) {
        case ' ':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handlePreviousScene();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleNextScene();
          break;
        case 'n':
        case 'N':
          e.preventDefault();
          setIsAddingNote(true);
          setIsPlaying(false);
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          setIsPanelCollapsed(!isPanelCollapsed);
          break;
        case 't':
        case 'T':
          e.preventDefault();
          setActiveTab(activeTab === 'paper' ? 'notes' : 'paper');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, isPanelCollapsed, activeTab, currentSceneIndex]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>
      {/* Top bar */}
      <div className="border-b border-[#E5E7EB] bg-white">
        <div className="max-w-[1920px] mx-auto px-8 py-4 flex items-center justify-between">
          <div style={{ fontFamily: "'Instrument Serif', serif" }} className="text-2xl">
            PaperVideo
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/library')}
              className="text-[#6B7280] hover:text-[#1A1A1A] transition-colors"
            >
              Library
            </button>
            <button className="text-[#6B7280] hover:text-[#1A1A1A] transition-colors">
              Sign In
            </button>
          </div>
        </div>
      </div>

      {/* Main viewer */}
      <div className="max-w-[1920px] mx-auto">
        <div className="flex">
          {/* Left panel - Video player */}
          <div 
            className="flex-1 p-8 transition-all"
            style={{ 
              width: isPanelCollapsed ? '100%' : '65%'
            }}
          >
            {/* Video player area */}
            <div 
              ref={videoRef}
              className="relative rounded-2xl overflow-hidden mb-6"
              style={{ 
                backgroundColor: '#1A1A1A',
                aspectRatio: '16/9'
              }}
            >
              {/* Mock video content */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-12">
                  <div 
                    style={{ 
                      fontFamily: "'Instrument Serif', serif",
                      fontSize: '48px',
                      color: '#FFFFFF',
                      marginBottom: '24px'
                    }}
                  >
                    {video.title}
                  </div>
                  <div style={{ color: '#9CA3AF', fontSize: '20px' }}>
                    Scene {currentSceneIndex + 1}: {currentScene?.label}
                  </div>
                  <div style={{ color: '#6B7280', fontSize: '16px', marginTop: '16px' }}>
                    {currentScene?.narration}
                  </div>
                </div>
              </div>

              {/* Play/Pause overlay */}
              <button
                onClick={handlePlayPause}
                className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity"
              >
                {isPlaying ? (
                  <Pause size={64} color="#FFFFFF" />
                ) : (
                  <Play size={64} color="#FFFFFF" />
                )}
              </button>

              {/* Controls */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <div className="flex items-center gap-4">
                  <button onClick={handlePlayPause} className="text-white hover:text-[#2563EB] transition-colors">
                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                  </button>
                  <button className="text-white hover:text-[#2563EB] transition-colors">
                    <Volume2 size={20} />
                  </button>
                  <span className="text-white text-sm">
                    {formatTime(currentTime)} / {formatTime(video.duration)}
                  </span>
                  <div className="flex-1" />
                  <select 
                    value={playbackSpeed}
                    onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                    className="bg-transparent text-white text-sm border border-white/30 rounded px-2 py-1"
                  >
                    <option value={1}>1x</option>
                    <option value={1.25}>1.25x</option>
                    <option value={1.5}>1.5x</option>
                    <option value={2}>2x</option>
                  </select>
                  <button className="text-white hover:text-[#2563EB] transition-colors">
                    <Maximize size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="h-1 bg-[#E5E7EB] rounded-full overflow-hidden">
                <div 
                  className="h-full transition-all"
                  style={{ 
                    width: `${progress}%`,
                    backgroundColor: '#2563EB'
                  }}
                />
              </div>
            </div>

            {/* Scene navigation */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={handlePreviousScene}
                  disabled={currentSceneIndex === 0}
                  className="p-2 rounded-lg hover:bg-white transition-colors disabled:opacity-50"
                  style={{ color: '#1A1A1A' }}
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="flex-1 flex gap-2 overflow-x-auto">
                  {video.scenes.map((scene: any, index: number) => (
                    <button
                      key={scene.id}
                      onClick={() => handleSceneClick(index)}
                      className="flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all hover:scale-105"
                      style={{
                        width: '160px',
                        borderColor: index === currentSceneIndex ? '#2563EB' : '#E5E7EB'
                      }}
                    >
                      <div 
                        className="aspect-video flex items-center justify-center"
                        style={{ backgroundColor: '#F4F4F0' }}
                      >
                        <div className="text-center p-2">
                          <div style={{ color: '#1A1A1A', fontSize: '12px', fontWeight: 500 }}>
                            {scene.id}
                          </div>
                        </div>
                      </div>
                      <div className="p-2 bg-white">
                        <div style={{ color: '#1A1A1A', fontSize: '11px', fontWeight: 500 }}>
                          {scene.label}
                        </div>
                        <div style={{ color: '#6B7280', fontSize: '10px' }}>
                          {scene.duration}s
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleNextScene}
                  disabled={currentSceneIndex === video.scenes.length - 1}
                  className="p-2 rounded-lg hover:bg-white transition-colors disabled:opacity-50"
                  style={{ color: '#1A1A1A' }}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            {/* Video metadata */}
            <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] mb-6">
              <h2 className="mb-2" style={{ color: '#1A1A1A', fontSize: '20px', fontWeight: 600 }}>
                {video.title}
              </h2>
              <div className="flex items-center gap-4 mb-4 text-sm" style={{ color: '#6B7280' }}>
                <span>{video.authors.slice(0, 3).join(", ")}</span>
                <span>·</span>
                <span>Generated {new Date(video.generatedAt).toLocaleDateString()}</span>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(video.url, '_blank')}
                  className="gap-2"
                >
                  <ExternalLink size={14} />
                  View Paper
                </Button>
                <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
                  <Share2 size={14} />
                  Share
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download size={14} />
                  Download
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <RefreshCw size={14} />
                  Regenerate
                </Button>
              </div>
            </div>

            {/* Scene breakdown (expandable) */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
              <button
                onClick={() => setShowSceneBreakdown(!showSceneBreakdown)}
                className="w-full p-6 flex items-center justify-between hover:bg-[#FAFAF8] transition-colors"
              >
                <span style={{ color: '#1A1A1A', fontWeight: 600 }}>
                  Scene Breakdown
                </span>
                {showSceneBreakdown ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              
              {showSceneBreakdown && (
                <div className="p-6 pt-0 space-y-4">
                  {video.scenes.map((scene: any, index: number) => (
                    <div 
                      key={scene.id}
                      className="flex gap-4 p-4 rounded-lg cursor-pointer hover:bg-[#F4F4F0] transition-colors"
                      onClick={() => handleSceneClick(index)}
                    >
                      <div 
                        className="flex-shrink-0 w-32 aspect-video rounded overflow-hidden"
                        style={{ backgroundColor: '#F4F4F0' }}
                      >
                        <div className="w-full h-full flex items-center justify-center">
                          <span style={{ color: '#6B7280', fontSize: '24px', fontWeight: 500 }}>
                            {scene.id}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span style={{ color: '#1A1A1A', fontWeight: 500 }}>
                            Scene {scene.id}: {scene.label}
                          </span>
                          <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#F4F4F0', color: '#6B7280' }}>
                            {scene.duration}s
                          </span>
                        </div>
                        <p className="text-sm" style={{ color: '#6B7280' }}>
                          {scene.narration}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right panel - Paper/Notes */}
          {!isPanelCollapsed && (
            <div 
              className="border-l border-[#E5E7EB] bg-white p-6 overflow-y-auto"
              style={{ 
                width: '35%',
                maxHeight: 'calc(100vh - 72px)'
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                  <TabsList>
                    <TabsTrigger value="paper">
                      <FileText size={16} className="mr-2" />
                      Paper
                    </TabsTrigger>
                    <TabsTrigger value="notes">
                      <StickyNote size={16} className="mr-2" />
                      Notes {notes.length > 0 && `(${notes.length})`}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                <button
                  onClick={() => setIsPanelCollapsed(true)}
                  className="p-2 hover:bg-[#F4F4F0] rounded-lg transition-colors"
                  style={{ color: '#6B7280' }}
                >
                  <X size={20} />
                </button>
              </div>

              {activeTab === 'paper' && (
                <div className="space-y-6">
                  {currentSection && (
                    <div 
                      className="p-4 rounded-lg"
                      style={{ backgroundColor: 'rgba(37, 99, 235, 0.05)' }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#2563EB' }} />
                        <span className="text-sm" style={{ color: '#2563EB', fontWeight: 500 }}>
                          Currently viewing
                        </span>
                      </div>
                      <h3 style={{ color: '#1A1A1A', fontWeight: 600 }} className="mb-2">
                        {currentSection.title}
                      </h3>
                    </div>
                  )}

                  {video.sections?.map((section: any) => (
                    <div key={section.id} className="pb-6 border-b border-[#E5E7EB] last:border-0">
                      <h3 
                        className="mb-3"
                        style={{ 
                          color: '#1A1A1A',
                          fontWeight: 600,
                          fontSize: '18px'
                        }}
                      >
                        {section.title}
                      </h3>
                      <p 
                        className="leading-relaxed"
                        style={{ 
                          color: '#6B7280',
                          fontSize: '14px'
                        }}
                      >
                        {section.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="space-y-4">
                  <Button
                    onClick={() => setIsAddingNote(true)}
                    className="w-full gap-2"
                    style={{ backgroundColor: '#2563EB' }}
                  >
                    <StickyNote size={16} />
                    Add Note at {formatTime(currentTime)}
                  </Button>

                  {isAddingNote && (
                    <div className="p-4 rounded-lg border-2" style={{ borderColor: '#2563EB', backgroundColor: '#FFFFFF' }}>
                      <div className="mb-2 text-sm" style={{ color: '#6B7280' }}>
                        Note at {formatTime(currentTime)}
                      </div>
                      <Textarea
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        placeholder="Type your note..."
                        className="mb-2"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button onClick={handleAddNote} size="sm">
                          Save
                        </Button>
                        <Button 
                          onClick={() => {
                            setIsAddingNote(false);
                            setNewNoteText("");
                          }} 
                          variant="outline" 
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {notes.length === 0 && !isAddingNote && (
                    <div className="text-center py-12">
                      <StickyNote size={48} style={{ color: '#E5E7EB' }} className="mx-auto mb-4" />
                      <p style={{ color: '#6B7280' }}>
                        No notes yet. Press 'N' or click the button above to add your first note.
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    {notes.map((note: any) => (
                      <div 
                        key={note.id}
                        className="p-4 rounded-lg border border-[#E5E7EB] hover:border-[#2563EB] transition-colors cursor-pointer group"
                        onClick={() => handleNoteClick(note.timestamp)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span 
                            className="text-sm px-2 py-1 rounded"
                            style={{ backgroundColor: '#F4F4F0', color: '#2563EB', fontWeight: 500 }}
                          >
                            {formatTime(note.timestamp)}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNote(note.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={14} style={{ color: '#DC2626' }} />
                          </button>
                        </div>
                        <p style={{ color: '#1A1A1A', fontSize: '14px' }}>
                          {note.text}
                        </p>
                        <p className="text-xs mt-2" style={{ color: '#9CA3AF' }}>
                          {new Date(note.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Collapsed panel toggle */}
          {isPanelCollapsed && (
            <button
              onClick={() => setIsPanelCollapsed(false)}
              className="fixed right-8 top-24 p-3 bg-white rounded-lg border border-[#E5E7EB] hover:border-[#2563EB] transition-colors shadow-lg"
              style={{ color: '#1A1A1A' }}
            >
              <FileText size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      <div 
        className="fixed bottom-8 right-8 p-4 bg-white rounded-lg border border-[#E5E7EB] shadow-lg text-xs"
        style={{ color: '#6B7280' }}
      >
        <div className="mb-2" style={{ color: '#1A1A1A', fontWeight: 600 }}>Keyboard Shortcuts</div>
        <div className="space-y-1">
          <div><kbd className="px-2 py-1 bg-[#F4F4F0] rounded">Space</kbd> Play/Pause</div>
          <div><kbd className="px-2 py-1 bg-[#F4F4F0] rounded">←→</kbd> Prev/Next Scene</div>
          <div><kbd className="px-2 py-1 bg-[#F4F4F0] rounded">N</kbd> Add Note</div>
          <div><kbd className="px-2 py-1 bg-[#F4F4F0] rounded">P</kbd> Toggle Panel</div>
          <div><kbd className="px-2 py-1 bg-[#F4F4F0] rounded">T</kbd> Switch Tab</div>
        </div>
      </div>
    </div>
  );
}

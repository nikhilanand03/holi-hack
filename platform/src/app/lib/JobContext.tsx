import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { getActiveJobs, getJobStatus, type JobStatus } from "./api";

interface ActiveJob {
  jobId: string;
  paperName: string;
  status: JobStatus["status"];
  scenesTotal: number;
  scenesDone: number;
}

interface JobContextValue {
  activeJobs: ActiveJob[];
  addJob: (jobId: string, paperName: string) => void;
  removeJob: (jobId: string) => void;
  completedJob: ActiveJob | null;
  clearCompleted: () => void;
}

const JobContext = createContext<JobContextValue>({
  activeJobs: [],
  addJob: () => {},
  removeJob: () => {},
  completedJob: null,
  clearCompleted: () => {},
});

export function useJobs() {
  return useContext(JobContext);
}

export function JobProvider({ children }: { children: React.ReactNode }) {
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
  const [completedJob, setCompletedJob] = useState<ActiveJob | null>(null);
  // Track paper names locally (backend doesn't know them)
  const paperNamesRef = useRef<Record<string, string>>({});
  const pollRef = useRef<ReturnType<typeof setInterval>>();
  const initializedRef = useRef(false);

  // Jobs are only tracked via addJob() — no global recovery from /active-jobs
  // This ensures users only see their own jobs, not other users'

  const addJob = useCallback((jobId: string, paperName: string) => {
    paperNamesRef.current[jobId] = paperName;
    setActiveJobs((prev) => {
      if (prev.some((j) => j.jobId === jobId)) return prev;
      return [
        ...prev,
        {
          jobId,
          paperName,
          status: "queued" as const,
          scenesTotal: 0,
          scenesDone: 0,
        },
      ];
    });
  }, []);

  const removeJob = useCallback((jobId: string) => {
    setActiveJobs((prev) => prev.filter((j) => j.jobId !== jobId));
  }, []);

  const clearCompleted = useCallback(() => {
    setCompletedJob(null);
  }, []);

  // Poll active jobs for status updates
  useEffect(() => {
    if (activeJobs.length === 0) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }

    const poll = async () => {
      let didComplete: ActiveJob | null = null;

      const updated = await Promise.all(
        activeJobs.map(async (job) => {
          if (job.status === "done" || job.status === "failed") return null;
          try {
            const status = await getJobStatus(job.jobId);
            const u = {
              ...job,
              status: status.status,
              scenesTotal: status.scenes_total,
              scenesDone: status.scenes_done,
            };
            if (status.status === "done") didComplete = u;
            return u;
          } catch {
            return job;
          }
        })
      );

      setActiveJobs((prev) => {
        const next = prev.map((j) => {
          const u = updated.find((u) => u && u.jobId === j.jobId);
          return u || j;
        });
        return next.filter((j) => j.status !== "done" && j.status !== "failed");
      });

      if (didComplete) setCompletedJob(didComplete);
    };

    poll();
    pollRef.current = setInterval(poll, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeJobs.length]);

  return (
    <JobContext.Provider
      value={{ activeJobs, addJob, removeJob, completedJob, clearCompleted }}
    >
      {children}
    </JobContext.Provider>
  );
}

import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";
import JobBanner from "./JobBanner";
import { useAuth } from "../lib/useAuth";
import { saveVideoToSupabase } from "../lib/supabaseVideos";

function extractArxivId(url: string): string | null {
  const m = url.match(/(\d{4}\.\d{4,5})/);
  return m ? m[1] : null;
}

export default function Layout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // After OAuth redirect, save any pending video to Supabase
  useEffect(() => {
    if (!user) return;
    const pendingRaw = localStorage.getItem("pendingVideoSave");
    if (!pendingRaw) return;

    try {
      const pending = JSON.parse(pendingRaw);
      localStorage.removeItem("pendingVideoSave");
      saveVideoToSupabase(user.id, pending.jobId, {
        ...pending.meta,
        arxiv_id: extractArxivId(pending.uploadUrl || ""),
        blob_url: pending.blobUrl,
      }).then(() => {
        console.log(`Saved pending video ${pending.jobId} to Supabase after sign-in`);
        navigate(`/v/${pending.jobId}`);
      }).catch(() => {
        navigate(`/v/${pending.jobId}`);
      });
    } catch {
      localStorage.removeItem("pendingVideoSave");
    }
  }, [user]);

  return (
    <>
      <Outlet />
      <JobBanner />
    </>
  );
}

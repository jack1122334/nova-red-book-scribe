
import { useState, useEffect } from "react";
import { cardsApi } from "@/lib/api";

export const useProjectData = (projectId?: string) => {
  const [hasCanvasData, setHasCanvasData] = useState(true);
  const [hasDraftData, setHasDraftData] = useState(false);
  const [draftCount, setDraftCount] = useState(0);
  const [userClosedDraft, setUserClosedDraft] = useState(false);

  useEffect(() => {
    const checkDraftData = async () => {
      if (!projectId) return;
      
      try {
        const cards = await cardsApi.list(projectId);
        const currentCount = cards.length;
        const hadData = hasDraftData;
        
        setHasDraftData(currentCount > 0);
        
        // If draft count increased from previous count, we should expand the draft area
        // but only if user hasn't manually closed it or if it's new content
        if (currentCount > draftCount) {
          setDraftCount(currentCount);
          // Reset user closed state when new content is added
          if (currentCount > 0 && (!hadData || currentCount > draftCount)) {
            setUserClosedDraft(false);
          }
        } else {
          setDraftCount(currentCount);
        }
      } catch (error) {
        console.error('Failed to check draft data:', error);
        setHasDraftData(false);
        setDraftCount(0);
      }
    };

    checkDraftData();
  }, [projectId, draftCount, hasDraftData]);

  return {
    hasCanvasData,
    hasDraftData,
    draftCount,
    userClosedDraft,
    setHasCanvasData,
    setHasDraftData,
    setUserClosedDraft
  };
};

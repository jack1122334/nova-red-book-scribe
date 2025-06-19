
import { useState, useEffect } from "react";
import { cardsApi } from "@/lib/api";

export const useProjectData = (projectId?: string) => {
  const [hasCanvasData, setHasCanvasData] = useState(true);
  const [hasDraftData, setHasDraftData] = useState(false);
  const [draftCount, setDraftCount] = useState(0);

  useEffect(() => {
    const checkDraftData = async () => {
      if (!projectId) return;
      
      try {
        const cards = await cardsApi.list(projectId);
        const currentCount = cards.length;
        setHasDraftData(currentCount > 0);
        
        // If draft count increased, we should expand the draft area
        if (currentCount > draftCount) {
          setDraftCount(currentCount);
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
  }, [projectId, draftCount]);

  return {
    hasCanvasData,
    hasDraftData,
    draftCount,
    setHasCanvasData,
    setHasDraftData
  };
};

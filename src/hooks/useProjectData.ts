
import { useState, useEffect } from "react";
import { cardsApi } from "@/lib/api";

export const useProjectData = (projectId?: string) => {
  const [hasCanvasData, setHasCanvasData] = useState(false);
  const [hasDraftData, setHasDraftData] = useState(false);

  useEffect(() => {
    const checkDraftData = async () => {
      if (!projectId) return;
      
      try {
        const cards = await cardsApi.list(projectId);
        setHasDraftData(cards.length > 0);
      } catch (error) {
        console.error('Failed to check draft data:', error);
        setHasDraftData(false);
      }
    };

    checkDraftData();
  }, [projectId]);

  return {
    hasCanvasData,
    hasDraftData,
    setHasCanvasData,
    setHasDraftData
  };
};

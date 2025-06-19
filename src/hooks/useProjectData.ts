
import { useState, useEffect } from "react";
import { cardsApi } from "@/lib/api";
import { canvasItemsApi } from "@/lib/canvasApi";

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

    const checkCanvasData = async () => {
      if (!projectId) return;
      
      try {
        const canvasItems = await canvasItemsApi.list(projectId);
        setHasCanvasData(canvasItems.length > 0);
      } catch (error) {
        console.error('Failed to check canvas data:', error);
        setHasCanvasData(false);
      }
    };

    checkDraftData();
    checkCanvasData();
  }, [projectId]);

  return {
    hasCanvasData,
    hasDraftData,
    setHasCanvasData,
    setHasDraftData
  };
};

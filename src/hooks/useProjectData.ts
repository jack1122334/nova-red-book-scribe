
import { useState, useEffect } from "react";
import { cardsApi } from "@/lib/api";
import { canvasApi } from "@/lib/canvasApi";

export const useProjectData = (projectId?: string) => {
  const [hasCanvasData, setHasCanvasData] = useState(false);
  const [hasDraftData, setHasDraftData] = useState(false);

  useEffect(() => {
    const checkData = async () => {
      if (!projectId) return;
      
      try {
        // Check draft data
        const cards = await cardsApi.list(projectId);
        setHasDraftData(cards.length > 0);
        
        // Check canvas data
        const canvasItems = await canvasApi.getCanvasItems(projectId);
        const insights = await canvasApi.getInsights(projectId);
        setHasCanvasData(canvasItems.length > 0 || insights.length > 0);
        
      } catch (error) {
        console.error('Failed to check project data:', error);
        setHasDraftData(false);
        setHasCanvasData(false);
      }
    };

    checkData();
  }, [projectId]);

  return {
    hasCanvasData,
    hasDraftData,
    setHasCanvasData,
    setHasDraftData
  };
};

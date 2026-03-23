import { useState, useEffect, useRef } from 'react';

export function useThinkingChunks(
  drawingStrokes,
  whiteboardItems,
  isTranscribing,
  options = {}
) {
  const { inactivityDelay = 2000, enabled = true } = options;

  const [isActivelyWorking, setIsActivelyWorking] = useState(false);
  const [showShareButton, setShowShareButton] = useState(false);
  const [capturedChunks, setCapturedChunks] = useState([]);
  const [highlightedChunkId, setHighlightedChunkId] = useState(null);

  const lastActivityTime = useRef(Date.now());
  const inactivityTimerRef = useRef(null);
  const drawingCountRef = useRef(0);
  const textCountRef = useRef(0);

  useEffect(() => {
    const hasNewDrawing = drawingStrokes.length > drawingCountRef.current;
    const hasNewText = whiteboardItems.length > textCountRef.current;
    const isWorking = hasNewDrawing || hasNewText || isTranscribing;

    if (isWorking) {
      setIsActivelyWorking(true);
      setShowShareButton(false);
      lastActivityTime.current = Date.now();

      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    }

    drawingCountRef.current = drawingStrokes.length;
    textCountRef.current = whiteboardItems.length;
  }, [drawingStrokes.length, whiteboardItems.length, isTranscribing]);

  useEffect(() => {
    if (!enabled) return;

    const checkInactivity = () => {
      const timeSinceLastActivity = Date.now() - lastActivityTime.current;

      if (timeSinceLastActivity >= inactivityDelay && isActivelyWorking) {
        setIsActivelyWorking(false);

        const hasUncapturedWork =
          drawingStrokes.some(s => s.isActive && !s.wasCaptured) ||
          whiteboardItems.some(i => i.isActive && !i.wasCaptured);

        if (hasUncapturedWork) {
          setShowShareButton(true);
        }
      }
    };

    const intervalId = setInterval(checkInactivity, 500);
    return () => clearInterval(intervalId);
  }, [enabled, inactivityDelay, isActivelyWorking, drawingStrokes, whiteboardItems]);

  useEffect(() => {
    if (isActivelyWorking) {
      setShowShareButton(false);
    }
  }, [isActivelyWorking]);

  const captureThinkingChunk = () => {
    const uncapturedDrawings = drawingStrokes.filter(s => s.isActive && !s.wasCaptured);
    const uncapturedText = whiteboardItems.filter(i => i.isActive && !i.wasCaptured);

    if (uncapturedDrawings.length === 0 && uncapturedText.length === 0) {
      return null;
    }

    const chunk = {
      id: `chunk-${Date.now()}`,
      timestamp: new Date(),
      drawings: uncapturedDrawings,
      textItems: uncapturedText,
      wasCaptured: true,
    };

    setCapturedChunks(prev => [...prev, chunk]);
    setHighlightedChunkId(chunk.id);
    setShowShareButton(false);

    setTimeout(() => {
      setHighlightedChunkId(null);
    }, 5000);

    return chunk;
  };

  const markItemsAsCaptured = (drawingIds, textIds) => {
    return { drawingIds, textIds };
  };

  const getHighlightedItemIds = () => {
    if (!highlightedChunkId) {
      return { drawings: [], text: [] };
    }

    const chunk = capturedChunks.find(c => c.id === highlightedChunkId);
    if (!chunk) {
      return { drawings: [], text: [] };
    }

    return {
      drawings: chunk.drawings.map(d => d.id),
      text: chunk.textItems.map(t => t.id),
    };
  };

  const hasUncapturedWork = () => {
    return (
      drawingStrokes.some(s => s.isActive && !s.wasCaptured) ||
      whiteboardItems.some(i => i.isActive && !i.wasCaptured)
    );
  };

  return {
    isActivelyWorking,
    showShareButton,
    capturedChunks,
    highlightedChunkId,
    captureThinkingChunk,
    markItemsAsCaptured,
    getHighlightedItemIds,
    hasUncapturedWork,
  };
}

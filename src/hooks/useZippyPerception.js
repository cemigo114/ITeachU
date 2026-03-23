import { useState, useEffect } from 'react';

export const drawingAwareMessages = {
  shapes: [
    { text: "I see you drew this box... what does it represent in the recipe?", mood: 'curious', pointingAt: 'right' },
    { text: "Why did you shade these boxes? I'm curious!", mood: 'curious', pointingAt: 'right' },
    { text: "What do these circles show in your explanation?", mood: 'curious', pointingAt: 'right' },
  ],
  objects: [
    { text: "What does this cup represent in your recipe?", mood: 'curious', pointingAt: 'right' },
    { text: "I see you drew strawberries... how do they connect to the doubling?", mood: 'curious', pointingAt: 'right' },
  ],
  arrows: [
    { text: "What does this arrow mean? How does it connect things?", mood: 'curious', pointingAt: 'right' },
    { text: "I see this arrow... how does that help show the doubling?", mood: 'curious', pointingAt: 'right' },
  ],
  multimodal: [
    { text: "How does this drawing relate to your equation?", mood: 'curious', pointingAt: 'right' },
    { text: "I see you drew a cup here and wrote '2 cups' — how does that show doubling?", mood: 'curious', pointingAt: 'center' },
    { text: "This arrow connects your drawing to the equation. Can you explain that connection?", mood: 'curious', pointingAt: 'right' },
  ],
  voice: [
    { text: "I think I understand — can you show me that on the diagram?", mood: 'thinking', pointingAt: 'center' },
    { text: "Ohhh! So you mean like drawing it out? Can you try that?", mood: 'excited', pointingAt: 'right' },
  ],
  afterVoice: [
    { text: "Hmm, I heard you say 'multiply by 2' — can you draw what that looks like?", mood: 'thinking', pointingAt: 'right' },
    { text: "Interesting! Can you show me with a picture or diagram?", mood: 'curious', pointingAt: 'right' },
  ],
};

export function useZippyPerception(whiteboardItems, drawingStrokes, isTranscribing) {
  const [lookingAt, setLookingAt] = useState('center');
  const [highlightedDrawingId, setHighlightedDrawingId] = useState(null);
  const [lastInputType, setLastInputType] = useState(null);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    setIsListening(isTranscribing);
    if (isTranscribing) {
      setLookingAt('center');
      setLastInputType('speech');
    }
  }, [isTranscribing]);

  useEffect(() => {
    if (whiteboardItems.length > 0) {
      const latestItem = whiteboardItems[whiteboardItems.length - 1];
      if (latestItem.type === 'text') {
        setLastInputType('text');
        setLookingAt('right');
      } else if (latestItem.type === 'speech') {
        setLastInputType('speech');
        setLookingAt('center');
      }
    }
  }, [whiteboardItems]);

  useEffect(() => {
    if (drawingStrokes.length > 0) {
      const latestStroke = drawingStrokes[drawingStrokes.length - 1];
      if (latestStroke.isActive) {
        setLastInputType('drawing');
        setLookingAt('right');
        setHighlightedDrawingId(latestStroke.id);
        setTimeout(() => setHighlightedDrawingId(null), 3000);
      }
    }
  }, [drawingStrokes]);

  const generateContextualMessage = () => {
    const hasDrawings = drawingStrokes.some(s => s.isActive);
    const hasText = whiteboardItems.some(i => i.isActive);
    const hasVoice = whiteboardItems.some(i => i.type === 'speech' && i.isActive);
    const latestDrawing = drawingStrokes.filter(s => s.isActive).pop();

    if (hasDrawings && (hasText || hasVoice)) {
      const msg = drawingAwareMessages.multimodal[Math.floor(Math.random() * drawingAwareMessages.multimodal.length)];
      return {
        id: Date.now().toString(),
        ...msg,
        timestamp: new Date(),
        referencedDrawingId: latestDrawing?.id,
      };
    }

    if (lastInputType === 'speech' && !isTranscribing) {
      const msg = drawingAwareMessages.afterVoice[Math.floor(Math.random() * drawingAwareMessages.afterVoice.length)];
      return {
        id: Date.now().toString(),
        ...msg,
        timestamp: new Date(),
      };
    }

    if (lastInputType === 'drawing' && latestDrawing) {
      let messages;
      if (latestDrawing.type === 'arrow') {
        messages = drawingAwareMessages.arrows;
      } else if (latestDrawing.type === 'rect' || latestDrawing.type === 'circle') {
        messages = drawingAwareMessages.shapes;
      } else {
        messages = drawingAwareMessages.objects;
      }

      const msg = messages[Math.floor(Math.random() * messages.length)];
      return {
        id: Date.now().toString(),
        ...msg,
        timestamp: new Date(),
        referencedDrawingId: latestDrawing.id,
      };
    }

    return null;
  };

  const highlightDrawing = (drawingId) => {
    setHighlightedDrawingId(drawingId);
    setLookingAt('right');
  };

  const clearHighlight = () => {
    setHighlightedDrawingId(null);
    setLookingAt('center');
  };

  return {
    lookingAt,
    highlightedDrawingId,
    lastInputType,
    isListening,
    generateContextualMessage,
    highlightDrawing,
    clearHighlight,
    setLookingAt,
  };
}

export function getZippyMoodFromActivity(hasNewDrawing, hasNewText, hasNewVoice, isListening) {
  if (isListening) return 'listening';
  if (hasNewDrawing || hasNewVoice) return 'curious';
  if (hasNewText) return 'thinking';
  return 'confused';
}

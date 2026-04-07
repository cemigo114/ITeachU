import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Pencil, Eraser, Trash2 } from 'lucide-react';

const PEN_COLOR = '#1f2937';
const ERASER_WIDTH = 24;
const PEN_WIDTH = 3;

/**
 * DrawingCanvas - allows students to draw on a canvas (pen, eraser, clear).
 * Supports mouse and touch. Exposes getImageDataUrl() via canvasApiRef.current.
 */
export default function DrawingCanvas({
  width = 400,
  height = 280,
  canvasApiRef,
  className = '',
  language = 'en'
}) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pen'); // 'pen' | 'eraser'
  const lastPointRef = useRef(null);

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current;
    return canvas ? canvas.getContext('2d') : null;
  }, []);

  const getPoint = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = PEN_COLOR;
    ctx.lineWidth = PEN_WIDTH;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [width, height]);

  const draw = useCallback((from, to) => {
    const ctx = getCtx();
    if (!ctx) return;
    if (tool === 'eraser') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = ERASER_WIDTH;
    } else {
      ctx.strokeStyle = PEN_COLOR;
      ctx.lineWidth = PEN_WIDTH;
    }
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }, [tool, getCtx]);

  const startDrawing = useCallback((e) => {
    e.preventDefault();
    const p = getPoint(e);
    if (p) {
      lastPointRef.current = p;
      setIsDrawing(true);
    }
  }, [getPoint]);

  const moveDrawing = useCallback((e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const p = getPoint(e);
    if (p && lastPointRef.current) {
      draw(lastPointRef.current, p);
      lastPointRef.current = p;
    }
  }, [isDrawing, getPoint, draw]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    lastPointRef.current = null;
  }, []);

  const clear = useCallback(() => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [getCtx]);

  const getImageDataUrl = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.toDataURL('image/png');
  }, []);

  // Expose getImageDataUrl to parent via ref
  useEffect(() => {
    if (canvasApiRef && typeof canvasApiRef === 'object') {
      canvasApiRef.current = { getImageDataUrl };
    }
    return () => {
      if (canvasApiRef && typeof canvasApiRef === 'object') canvasApiRef.current = null;
    };
  }, [canvasApiRef, getImageDataUrl]);

  const labels = {
    pen: language === 'es' ? 'Lápiz' : 'Pen',
    eraser: language === 'es' ? 'Borrador' : 'Eraser',
    clear: language === 'es' ? 'Borrar todo' : 'Clear',
    drawHere: language === 'es' ? 'Dibuja aquí' : 'Draw here'
  };

  return (
    <div className={`flex flex-col rounded-xl border border-gray-200 bg-gray-50 overflow-hidden ${className}`}>
      <div className="flex items-center gap-2 p-2 border-b border-gray-200 bg-white">
        <button
          type="button"
          onClick={() => setTool('pen')}
          className={`p-2 rounded-lg transition-colors ${tool === 'pen' ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'}`}
          title={labels.pen}
        >
          <Pencil className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => setTool('eraser')}
          className={`p-2 rounded-lg transition-colors ${tool === 'eraser' ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'}`}
          title={labels.eraser}
        >
          <Eraser className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={clear}
          className="p-2 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          title={labels.clear}
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="block w-full cursor-crosshair touch-none border-0"
        style={{ maxWidth: '100%', height: 'auto' }}
        onMouseDown={startDrawing}
        onMouseMove={moveDrawing}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={moveDrawing}
        onTouchEnd={stopDrawing}
        aria-label={labels.drawHere}
      />
    </div>
  );
}

export { DrawingCanvas };

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Hand, PenLine, Highlighter, Square, Circle as CircleIcon,
  ArrowRight, Eraser, Undo2, Trash2, Mic, RotateCcw, PenSquare,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ShareWithZippyButton, WatchingIndicator } from './ShareWithZippyButton';

const COLORS = [
  { value: '#0A4D8C', label: 'Blue' },
  { value: '#1a1a1a', label: 'Black' },
  { value: '#FF6B4A', label: 'Coral' },
  { value: '#00A896', label: 'Teal' },
  { value: '#7C3AED', label: 'Purple' },
  { value: '#16a34a', label: 'Green' },
];
const WIDTHS = [2, 4, 7];
const DRAWING_CANVAS_MIN_H = 180;
const SESSION_PADDING = 20;

function pointsToPath(pts) {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x},${pts[0].y} l 0.01,0`;
  let d = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2;
    const my = (pts[i].y + pts[i + 1].y) / 2;
    d += ` Q ${pts[i].x},${pts[i].y} ${mx},${my}`;
  }
  const last = pts[pts.length - 1];
  d += ` L ${last.x},${last.y}`;
  return d;
}

function arrowHead(x1, y1, x2, y2, size) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const ax = x2 - size * Math.cos(a - Math.PI / 6);
  const ay = y2 - size * Math.sin(a - Math.PI / 6);
  const bx = x2 - size * Math.cos(a + Math.PI / 6);
  const by = y2 - size * Math.sin(a + Math.PI / 6);
  return `${x2},${y2} ${ax},${ay} ${bx},${by}`;
}

function getStrokeBounds(strokes) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const s of strokes) {
    if (s.points.length > 0) {
      for (const p of s.points) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      }
    } else {
      minX = Math.min(minX, s.x1, s.x2);
      minY = Math.min(minY, s.y1, s.y2);
      maxX = Math.max(maxX, s.x1, s.x2);
      maxY = Math.max(maxY, s.y1, s.y2);
    }
  }
  if (!isFinite(minX)) return null;
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}

function isNearStroke(s, px, py, threshold = 20) {
  if (s.type === 'freehand' || s.type === 'highlight') {
    const step = Math.max(1, Math.floor(s.points.length / 40));
    for (let i = 0; i < s.points.length; i += step) {
      if (Math.hypot(s.points[i].x - px, s.points[i].y - py) < threshold) return true;
    }
    return false;
  }
  const minX = Math.min(s.x1, s.x2) - threshold;
  const maxX = Math.max(s.x1, s.x2) + threshold;
  const minY = Math.min(s.y1, s.y2) - threshold;
  const maxY = Math.max(s.y1, s.y2) + threshold;
  return px >= minX && px <= maxX && py >= minY && py <= maxY;
}

function StrokeSVG({ stroke, isHighlighted = false }) {
  const { color, width } = stroke;
  const glowStroke = isHighlighted ? '#00A896' : color;
  const glowWidth = isHighlighted ? width + 4 : width;

  if (stroke.type === 'freehand') {
    const d = pointsToPath(stroke.points);
    return (
      <g>
        {isHighlighted && (
          <motion.path d={d} stroke={glowStroke} strokeWidth={glowWidth + 8} fill="none"
            strokeLinecap="round" strokeLinejoin="round" opacity={0.5}
            animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ repeat: Infinity, duration: 2 }} />
        )}
        <path d={d} stroke={color} strokeWidth={width} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    );
  }
  if (stroke.type === 'highlight') {
    const d = pointsToPath(stroke.points);
    return <path d={d} stroke={color} strokeWidth={width * 10} fill="none" strokeLinecap="round" opacity={0.28} />;
  }
  if (stroke.type === 'rect') {
    const x = Math.min(stroke.x1, stroke.x2), y = Math.min(stroke.y1, stroke.y2);
    const w = Math.abs(stroke.x2 - stroke.x1), h = Math.abs(stroke.y2 - stroke.y1);
    return <rect x={x} y={y} width={w} height={h} fill="none" stroke={color} strokeWidth={width} rx={4} />;
  }
  if (stroke.type === 'circle') {
    const cx = (stroke.x1 + stroke.x2) / 2, cy = (stroke.y1 + stroke.y2) / 2;
    const rx = Math.abs(stroke.x2 - stroke.x1) / 2, ry = Math.abs(stroke.y2 - stroke.y1) / 2;
    return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={color} strokeWidth={width} />;
  }
  if (stroke.type === 'arrow') {
    const hs = Math.max(14, width * 4);
    return (
      <g>
        <line x1={stroke.x1} y1={stroke.y1} x2={stroke.x2} y2={stroke.y2} stroke={color} strokeWidth={width} strokeLinecap="round" />
        <polygon points={arrowHead(stroke.x1, stroke.y1, stroke.x2, stroke.y2, hs)} fill={color} />
      </g>
    );
  }
  if (stroke.type === 'numberline') {
    const y = (stroke.y1 + stroke.y2) / 2;
    const minX = Math.min(stroke.x1, stroke.x2);
    const maxX = Math.max(stroke.x1, stroke.x2);
    const len = maxX - minX;
    if (len < 30) return null;
    const hs = 10;
    const numTicks = 10;
    const tickSp = len / numTicks;
    const pts = arrowHead(minX, y, maxX + hs + 2, y, hs);
    return (
      <g>
        <line x1={minX} y1={y} x2={maxX + hs} y2={y} stroke={color} strokeWidth={width} strokeLinecap="round" />
        <polygon points={pts} fill={color} />
        {Array.from({ length: numTicks + 1 }, (_, i) => {
          const tx = minX + i * tickSp;
          const major = i % 2 === 0;
          return (
            <g key={i}>
              <line x1={tx} y1={y - (major ? 9 : 5)} x2={tx} y2={y + (major ? 9 : 5)}
                stroke={color} strokeWidth={major ? width : width * 0.6} />
              {major && <text x={tx} y={y + 22} textAnchor="middle" fontSize={10} fill={color} fontFamily="sans-serif">{i}</text>}
            </g>
          );
        })}
      </g>
    );
  }
  return null;
}

function ShapePreview({ tool, s, e, color, width }) {
  const dash = '7 4';
  if (tool === 'rect') {
    const x = Math.min(s.x, e.x), y = Math.min(s.y, e.y);
    return <rect x={x} y={y} width={Math.abs(e.x - s.x)} height={Math.abs(e.y - s.y)} fill="none" stroke={color} strokeWidth={width} strokeDasharray={dash} rx={4} opacity={0.75} />;
  }
  if (tool === 'circle') {
    const cx = (s.x + e.x) / 2, cy = (s.y + e.y) / 2;
    return <ellipse cx={cx} cy={cy} rx={Math.abs(e.x - s.x) / 2} ry={Math.abs(e.y - s.y) / 2} fill="none" stroke={color} strokeWidth={width} strokeDasharray={dash} opacity={0.75} />;
  }
  if (tool === 'arrow') {
    const hs = Math.max(14, width * 4);
    return (
      <>
        <line x1={s.x} y1={s.y} x2={e.x} y2={e.y} stroke={color} strokeWidth={width} strokeLinecap="round" opacity={0.75} />
        <polygon points={arrowHead(s.x, s.y, e.x, e.y, hs)} fill={color} opacity={0.75} />
      </>
    );
  }
  if (tool === 'numberline') {
    const y = (s.y + e.y) / 2;
    const minX = Math.min(s.x, e.x), maxX = Math.max(s.x, e.x);
    const hs = 10;
    return (
      <>
        <line x1={minX} y1={y} x2={maxX + hs} y2={y} stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray={dash} opacity={0.75} />
        <polygon points={arrowHead(minX, y, maxX + hs + 2, y, hs)} fill={color} opacity={0.75} />
      </>
    );
  }
  return null;
}

function DrawingSessionBlock({ strokes, showHistory, highlightedDrawingId, onDelete, isCompleted }) {
  const activeStrokes = strokes.filter(s => s.isActive || showHistory);
  if (activeStrokes.length === 0) return null;

  const bounds = getStrokeBounds(activeStrokes);
  if (!bounds) return null;

  const pad = SESSION_PADDING;
  const svgViewW = Math.max(bounds.w + pad * 2, 120);
  const svgViewH = Math.max(bounds.h + pad * 2, 80);
  const tx = -bounds.minX + pad;
  const ty = -bounds.minY + pad;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      className="relative group"
    >
      <div
        className="relative rounded-xl overflow-hidden"
        style={{
          background: 'rgba(248,250,252,0.85)',
          boxShadow: '0 1px 6px rgba(10,77,140,0.07)',
          border: '1px solid rgba(10,77,140,0.06)',
        }}
      >
        <div className="absolute top-2.5 left-3 z-10 flex items-center gap-1 opacity-40 select-none">
          <PenSquare className="h-3 w-3 text-[#0A4D8C]" />
          <span className="text-[10px] text-[#0A4D8C] tracking-wider uppercase">Drawing</span>
        </div>

        <svg
          width="100%"
          viewBox={`0 0 ${svgViewW} ${svgViewH}`}
          style={{ display: 'block', minHeight: 80 }}
        >
          <defs>
            <filter id="session-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <g transform={`translate(${tx}, ${ty})`}>
            {activeStrokes.map(s => (
              <StrokeSVG
                key={s.id}
                stroke={s}
                isHighlighted={!!(highlightedDrawingId && highlightedDrawingId === s.id)}
              />
            ))}
          </g>
        </svg>
      </div>

      {!isCompleted && (
        <button
          onClick={onDelete}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 flex items-center justify-center rounded-full bg-white shadow border border-red-100 text-red-400 hover:text-red-600 hover:bg-red-50"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}
    </motion.div>
  );
}

function TextMessageBlock({ item, showHistory, isCompleted, onRevise, onErase, t, allItems }) {
  const isRevised = allItems.some(i => i.revisedFrom === item.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: item.isActive ? 1 : (showHistory ? 0.35 : 0), y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      className="relative group"
    >
      {item.revisionNumber && item.revisionNumber > 0 && (
        <div className="absolute -top-5 left-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow z-10">
          v{item.revisionNumber + 1}
        </div>
      )}

      <div
        className="px-4 pt-7 pb-3 rounded-xl relative"
        style={{
          background: item.type === 'speech'
            ? 'rgba(255,107,74,0.04)'
            : 'rgba(10,77,140,0.03)',
          boxShadow: '0 1px 6px rgba(10,77,140,0.06)',
          border: '1px solid rgba(10,77,140,0.05)',
        }}
      >
        <div className="absolute top-2.5 left-3 flex items-center gap-1 opacity-40 select-none">
          {item.type === 'speech' ? (
            <>
              <Mic className="h-3 w-3 text-[#FF6B4A]" />
              <span className="text-[10px] text-[#FF6B4A] tracking-wider uppercase">Voice</span>
            </>
          ) : (
            <>
              <span className="text-[10px] text-[#0A4D8C] tracking-wider uppercase font-bold">T</span>
              <span className="text-[10px] text-[#0A4D8C] tracking-wider uppercase">Text</span>
            </>
          )}
        </div>

        <motion.p
          initial={{ clipPath: 'inset(0 100% 0 0)', opacity: 0 }}
          animate={{ clipPath: 'inset(0 0% 0 0)', opacity: item.isActive ? 1 : 0.35 }}
          transition={{
            clipPath: { duration: 1.2, ease: [0.25, 0.1, 0.25, 1] },
            opacity: { duration: 0.3 },
          }}
          className={item.isActive ? 'text-[#0A4D8C]' : 'text-gray-400 line-through'}
          style={{
            fontFamily: "'Kalam', cursive",
            fontSize: '26px',
            fontWeight: 400,
            letterSpacing: '0.06em',
            lineHeight: '2.2',
            wordSpacing: '0.12em',
          }}
        >
          {item.content}
        </motion.p>

        {!item.isActive && isRevised && (
          <span className="text-purple-500 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200 text-xs">
            Revised
          </span>
        )}
      </div>

      {item.isActive && !isCompleted && (
        <div className="mt-1 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onRevise(item.id)}
            className="h-7 px-2.5 text-xs bg-white hover:bg-purple-50 shadow rounded-lg flex items-center gap-1.5 text-purple-600 border border-purple-200 transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            {t('revise')}
          </button>
          <button
            onClick={() => onErase(item.id)}
            className="h-7 w-7 flex items-center justify-center text-red-400 hover:text-red-600 bg-white hover:bg-red-50 shadow rounded-lg border border-red-200 transition-colors"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}
    </motion.div>
  );
}

function ActiveDrawingCanvas({ tool, penColor, penWidth, onCommit }) {
  const svgRef = useRef(null);
  const [localStrokes, setLocalStrokes] = useState([]);
  const [currentPoints, setCurrentPoints] = useState([]);
  const [shapeStart, setShapeStart] = useState(null);
  const [shapeEnd, setShapeEnd] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [canvasH, setCanvasH] = useState(DRAWING_CANVAS_MIN_H);
  const isDown = useRef(false);
  const undoStack = useRef([]);
  const inactivityRef = useRef(null);

  useEffect(() => {
    return () => {
      if (inactivityRef.current) clearTimeout(inactivityRef.current);
    };
  }, []);

  useEffect(() => {
    if (localStrokes.length === 0) return;
    const bounds = getStrokeBounds(localStrokes);
    if (bounds) {
      setCanvasH(h => Math.max(h, bounds.maxY + 60));
    }
  }, [localStrokes]);

  const getCoords = useCallback((e) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const saveHistory = useCallback(() => {
    undoStack.current.push(localStrokes.map(s => ({ ...s, points: [...s.points] })));
    if (undoStack.current.length > 40) undoStack.current.shift();
  }, [localStrokes]);

  const scheduleInactivityCommit = useCallback(() => {
    if (inactivityRef.current) clearTimeout(inactivityRef.current);
    inactivityRef.current = setTimeout(() => {
      setLocalStrokes(current => {
        if (current.length > 0) onCommit(current);
        return [];
      });
      setCanvasH(DRAWING_CANVAS_MIN_H);
    }, 4000);
  }, [onCommit]);

  const findNear = useCallback((x, y) =>
    [...localStrokes].reverse().find(s => s.isActive && isNearStroke(s, x, y)),
    [localStrokes]);

  const onPointerDown = useCallback((e) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    isDown.current = true;
    const c = getCoords(e);
    if (tool === 'pen' || tool === 'highlight') {
      setCurrentPoints([c]);
    } else if (tool === 'rect' || tool === 'circle' || tool === 'arrow' || tool === 'numberline') {
      setShapeStart(c); setShapeEnd(c);
    } else if (tool === 'eraser') {
      const hit = findNear(c.x, c.y);
      if (hit) {
        saveHistory();
        setLocalStrokes(prev => prev.map(s => s.id === hit.id ? { ...s, isActive: false } : s));
      }
    }
  }, [tool, getCoords, findNear, saveHistory]);

  const onPointerMove = useCallback((e) => {
    const c = getCoords(e);
    if (!isDown.current) {
      if (tool === 'eraser') setHoveredId(findNear(c.x, c.y)?.id ?? null);
      return;
    }
    if (tool === 'pen' || tool === 'highlight') {
      setCurrentPoints(prev => [...prev, c]);
    } else if (shapeStart && (tool === 'rect' || tool === 'circle' || tool === 'arrow' || tool === 'numberline')) {
      setShapeEnd(c);
    } else if (tool === 'eraser') {
      const hit = findNear(c.x, c.y);
      setHoveredId(hit?.id ?? null);
      if (hit) {
        saveHistory();
        setLocalStrokes(prev => prev.map(s => s.id === hit.id ? { ...s, isActive: false } : s));
      }
    }
  }, [tool, getCoords, shapeStart, findNear, saveHistory]);

  const onPointerUp = useCallback(() => {
    if (!isDown.current) return;
    isDown.current = false;
    if (tool === 'pen' || tool === 'highlight') {
      if (currentPoints.length > 1) {
        saveHistory();
        const newStroke = {
          id: Date.now().toString(),
          type: tool === 'highlight' ? 'highlight' : 'freehand',
          points: currentPoints,
          x1: 0, y1: 0, x2: 0, y2: 0,
          color: penColor, width: penWidth,
          isActive: true, timestamp: new Date(),
        };
        setLocalStrokes(prev => [...prev, newStroke]);
        scheduleInactivityCommit();
      }
      setCurrentPoints([]);
    } else if (shapeStart && shapeEnd) {
      const dist = Math.hypot(shapeEnd.x - shapeStart.x, shapeEnd.y - shapeStart.y);
      if (dist > 12) {
        saveHistory();
        const typeMap = {
          rect: 'rect', circle: 'circle', arrow: 'arrow', numberline: 'numberline',
        };
        const newStroke = {
          id: Date.now().toString(),
          type: typeMap[tool] ?? 'rect',
          points: [],
          x1: shapeStart.x, y1: shapeStart.y, x2: shapeEnd.x, y2: shapeEnd.y,
          color: penColor, width: penWidth,
          isActive: true, timestamp: new Date(),
        };
        setLocalStrokes(prev => [...prev, newStroke]);
        scheduleInactivityCommit();
      }
      setShapeStart(null); setShapeEnd(null);
    }
  }, [tool, currentPoints, shapeStart, shapeEnd, penColor, penWidth, saveHistory, scheduleInactivityCommit]);

  const handleUndo = () => {
    const prev = undoStack.current.pop();
    if (prev !== undefined) setLocalStrokes(prev);
  };

  const handleCommitNow = () => {
    if (inactivityRef.current) clearTimeout(inactivityRef.current);
    if (localStrokes.length > 0) {
      onCommit(localStrokes);
      setLocalStrokes([]);
      setCanvasH(DRAWING_CANVAS_MIN_H);
    }
  };

  const cursor = tool === 'eraser' ? 'cell' : 'crosshair';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      className="relative rounded-xl overflow-hidden"
      style={{
        background: 'rgba(10,77,140,0.02)',
        boxShadow: '0 1px 8px rgba(10,77,140,0.08)',
        border: '1.5px dashed rgba(10,77,140,0.15)',
      }}
    >
      <div className="absolute top-2.5 left-3 flex items-center gap-1.5 select-none pointer-events-none z-10 opacity-50">
        <PenSquare className="h-3 w-3 text-[#0A4D8C]" />
        <span className="text-[10px] text-[#0A4D8C] tracking-wider uppercase">
          {localStrokes.length === 0 ? 'Draw here…' : 'Drawing…'}
        </span>
      </div>

      <div className="absolute top-2 right-2 z-10 flex gap-1">
        {localStrokes.length > 0 && (
          <>
            <button
              onClick={handleUndo}
              className="h-6 w-6 flex items-center justify-center rounded-full bg-white/90 shadow text-gray-400 hover:text-gray-700 border border-gray-200"
              title="Undo"
            >
              <Undo2 className="h-3 w-3" />
            </button>
            <button
              onClick={handleCommitNow}
              className="h-6 px-2 flex items-center justify-center rounded-full bg-[#00A896] text-white shadow text-[10px] font-medium"
              title="Add to whiteboard"
            >
              Done ✓
            </button>
          </>
        )}
      </div>

      <svg
        ref={svgRef}
        className="w-full select-none block"
        style={{ height: canvasH, cursor, touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={() => { setHoveredId(null); if (isDown.current) { isDown.current = false; onPointerUp(); } }}
      >
        {localStrokes.map(s => (
          <g key={s.id} opacity={s.isActive ? (hoveredId === s.id && tool === 'eraser' ? 0.3 : 1) : 0.2}>
            <StrokeSVG stroke={s} />
          </g>
        ))}
        {currentPoints.length > 1 && (
          tool === 'highlight' ? (
            <path d={pointsToPath(currentPoints)} stroke={penColor} strokeWidth={penWidth * 10}
              fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.28} />
          ) : (
            <path d={pointsToPath(currentPoints)} stroke={penColor} strokeWidth={penWidth}
              fill="none" strokeLinecap="round" strokeLinejoin="round" />
          )
        )}
        {shapeStart && shapeEnd && (
          <ShapePreview tool={tool} s={shapeStart} e={shapeEnd} color={penColor} width={penWidth} />
        )}
      </svg>
    </motion.div>
  );
}

function ToolBtn({ icon, label, active, activeClass = 'bg-[#0A4D8C] text-white shadow-md', onClick }) {
  return (
    <button onClick={onClick} title={label}
      className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-150 ${active ? activeClass + ' scale-105' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'}`}>
      {icon}
    </button>
  );
}

function Divider() {
  return <div className="w-7 h-px bg-gray-100 my-0.5 flex-shrink-0" />;
}

export function WhiteboardPanel({
  whiteboardItems, showHistory, isCompleted,
  isTranscribing, transcribingWords,
  onReviseItem, onEraseTextItem,
  drawingStrokes, onDrawingStrokesChange,
  whiteboardEndRef, t,
  highlightedDrawingId,
  showShareButton,
  isActivelyWorking,
  onShareWithZippy,
}) {
  const [tool, setTool] = useState('scroll');
  const [penColor, setPenColor] = useState('#0A4D8C');
  const [penWidth, setPenWidth] = useState(3);

  const scrollRef = useRef(null);
  const isDrawingMode = tool !== 'scroll';

  useEffect(() => {
    whiteboardEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [whiteboardItems, transcribingWords]);

  const drawingSessions = useMemo(() => {
    const bySession = {};
    for (const s of drawingStrokes) {
      const key = s.sessionId ?? s.id;
      if (!bySession[key]) bySession[key] = [];
      bySession[key].push(s);
    }
    return Object.entries(bySession).map(([sessionId, strokes]) => ({
      sessionId,
      strokes,
      timestamp: strokes[0]?.timestamp.getTime() ?? 0,
    }));
  }, [drawingStrokes]);

  const mergedMessages = useMemo(() => {
    const list = [
      ...whiteboardItems.map(item => ({
        kind: 'text',
        item,
        ts: parseInt(item.id) || 0,
      })),
      ...drawingSessions.map(ds => ({
        kind: 'drawing',
        sessionId: ds.sessionId,
        strokes: ds.strokes,
        ts: ds.timestamp,
      })),
    ];
    return list.sort((a, b) => a.ts - b.ts);
  }, [whiteboardItems, drawingSessions]);

  const handleCommitDrawing = useCallback((strokes) => {
    const sessionId = `session-${Date.now()}`;
    const committed = strokes.map(s => ({ ...s, sessionId }));
    onDrawingStrokesChange([...drawingStrokes, ...committed]);
    setTool('scroll');
  }, [drawingStrokes, onDrawingStrokesChange]);

  const handleDeleteSession = useCallback((sessionId) => {
    onDrawingStrokesChange(
      drawingStrokes.map(s => s.sessionId === sessionId ? { ...s, isActive: false } : s)
    );
  }, [drawingStrokes, onDrawingStrokesChange]);

  const handleUndoSession = useCallback(() => {
    const sessions = [...drawingSessions].sort((a, b) => b.timestamp - a.timestamp);
    if (sessions.length === 0) return;
    const last = sessions[0];
    onDrawingStrokesChange(
      drawingStrokes.filter(s => s.sessionId !== last.sessionId)
    );
  }, [drawingStrokes, drawingSessions, onDrawingStrokesChange]);

  const hasAnyContent =
    whiteboardItems.some(i => i.isActive) ||
    drawingStrokes.some(s => s.isActive) ||
    mergedMessages.length > 0;

  return (
    <div className="flex-1 flex overflow-hidden mx-4 md:mx-6 my-3 gap-2">

      <div className="flex-shrink-0 w-11 md:w-12 flex flex-col items-center bg-white rounded-2xl shadow-xl border border-gray-200 py-2.5 gap-0.5 overflow-y-auto">
        <ToolBtn
          icon={<Hand className="h-4 w-4" />} label="Scroll & read"
          active={tool === 'scroll'} activeClass="bg-gray-700 text-white shadow-md"
          onClick={() => setTool('scroll')}
        />
        <Divider />
        <ToolBtn icon={<PenLine className="h-4 w-4" />} label="Pen (freehand)"
          active={tool === 'pen'} activeClass="bg-[#0A4D8C] text-white shadow-md"
          onClick={() => setTool('pen')} />
        <ToolBtn icon={<Highlighter className="h-4 w-4" />} label="Highlighter"
          active={tool === 'highlight'} activeClass="bg-yellow-400 text-white shadow-md"
          onClick={() => setTool('highlight')} />
        <Divider />
        <ToolBtn icon={<Square className="h-4 w-4" />} label="Rectangle"
          active={tool === 'rect'} activeClass="bg-[#00A896] text-white shadow-md"
          onClick={() => setTool('rect')} />
        <ToolBtn icon={<CircleIcon className="h-4 w-4" />} label="Circle"
          active={tool === 'circle'} activeClass="bg-[#00A896] text-white shadow-md"
          onClick={() => setTool('circle')} />
        <ToolBtn icon={<ArrowRight className="h-4 w-4" />} label="Arrow"
          active={tool === 'arrow'} activeClass="bg-[#00A896] text-white shadow-md"
          onClick={() => setTool('arrow')} />
        <Divider />
        <ToolBtn icon={<Eraser className="h-4 w-4" />} label="Eraser"
          active={tool === 'eraser'} activeClass="bg-red-400 text-white shadow-md"
          onClick={() => setTool('eraser')} />
        <div className="flex-1 min-h-2" />
        <button
          onClick={handleUndoSession}
          title="Undo last drawing"
          className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        >
          <Undo2 className="h-4 w-4" />
        </button>
      </div>

      <div
        className="flex-1 bg-white rounded-2xl shadow-2xl border-2 border-gray-200 relative overflow-hidden flex flex-col"
        style={{
          backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        <ShareWithZippyButton
          visible={showShareButton ?? false}
          onClick={onShareWithZippy ?? (() => {})}
          position="floating"
        />
        <WatchingIndicator visible={isActivelyWorking ?? false} />

        <AnimatePresence>
          {isDrawingMode && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute top-3 left-3 z-30 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-gray-100 px-2.5 py-1.5"
            >
              {COLORS.map(c => (
                <button
                  key={c.value}
                  onClick={() => setPenColor(c.value)}
                  className="rounded-full transition-transform"
                  style={{
                    width: penColor === c.value ? 20 : 16,
                    height: penColor === c.value ? 20 : 16,
                    backgroundColor: c.value,
                    boxShadow: penColor === c.value ? `0 0 0 2px white, 0 0 0 4px ${c.value}` : 'none',
                  }}
                  title={c.label}
                />
              ))}
              <div className="w-px h-4 bg-gray-200 mx-0.5" />
              {WIDTHS.map(w => (
                <button
                  key={w}
                  onClick={() => setPenWidth(w)}
                  className={`rounded-full bg-gray-700 transition-all ${penWidth === w ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}
                  style={{ width: w * 2.5 + 6, height: w * 2.5 + 6 }}
                  title={`Width ${w}`}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="p-6 flex flex-col gap-5">
            {!hasAnyContent && !isTranscribing && !isDrawingMode && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="min-h-52 flex items-center justify-center"
              >
                <div className="text-center select-none">
                  <div className="text-5xl mb-3">✍️</div>
                  <p className="text-gray-300 text-sm max-w-xs">{t('teachingSpaceDesc')}</p>
                </div>
              </motion.div>
            )}

            <AnimatePresence>
              {mergedMessages.map(msg => {
                if (msg.kind === 'text') {
                  return (
                    <TextMessageBlock
                      key={msg.item.id}
                      item={msg.item}
                      showHistory={showHistory}
                      isCompleted={isCompleted}
                      onRevise={onReviseItem}
                      onErase={onEraseTextItem}
                      t={t}
                      allItems={whiteboardItems}
                    />
                  );
                }
                return (
                  <DrawingSessionBlock
                    key={msg.sessionId}
                    strokes={msg.strokes}
                    showHistory={showHistory}
                    highlightedDrawingId={highlightedDrawingId}
                    onDelete={() => handleDeleteSession(msg.sessionId)}
                    isCompleted={isCompleted}
                  />
                );
              })}
            </AnimatePresence>

            {isTranscribing && transcribingWords.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 pt-7 pb-3 rounded-xl relative"
                style={{
                  background: 'rgba(255,107,74,0.04)',
                  boxShadow: '0 1px 6px rgba(10,77,140,0.06)',
                  border: '1px solid rgba(255,107,74,0.1)',
                }}
              >
                <div className="absolute top-2.5 left-3 flex items-center gap-1 opacity-40">
                  <Mic className="h-3 w-3 text-[#FF6B4A]" />
                  <span className="text-[10px] text-[#FF6B4A] tracking-wider uppercase">Listening…</span>
                </div>
                <motion.p
                  className="text-[#0A4D8C]"
                  style={{
                    fontFamily: "'Kalam', cursive",
                    fontSize: '26px', fontWeight: 400, lineHeight: '2.2',
                  }}
                  initial={{ clipPath: 'inset(0 100% 0 0)' }}
                  animate={{ clipPath: 'inset(0 0% 0 0)' }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                >
                  {transcribingWords.join(' ')}
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="ml-1"
                  >|</motion.span>
                </motion.p>
              </motion.div>
            )}

            <AnimatePresence>
              {isDrawingMode && (
                <ActiveDrawingCanvas
                  key="active-canvas"
                  tool={tool}
                  penColor={penColor}
                  penWidth={penWidth}
                  onCommit={handleCommitDrawing}
                />
              )}
            </AnimatePresence>

            <div ref={whiteboardEndRef} className="h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default WhiteboardPanel;

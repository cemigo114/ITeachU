import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

const LumoMascot = ({ emotion = 'happy', size = 'medium', showControls = false }) => {
  const [currentEmotion, setCurrentEmotion] = useState(emotion);

  const emotions = [
    { id: 'happy', label: 'Happy', desc: 'Soft hop + smile, steady glow' },
    { id: 'thinking', label: 'Thinking', desc: 'Wings slow flap, eyes up, pulse' },
    { id: 'confused', label: 'Confused', desc: 'Head tilt, wings twitch' },
    { id: 'excited', label: 'Excited', desc: 'Rapid tail flash, fast flutter' },
    { id: 'encouraging', label: 'Encouraging', desc: 'Gentle nod, sparkles' },
    { id: 'listening', label: 'Listening', desc: 'Wings fold, eyes widen' },
    { id: 'surprised', label: 'Surprised', desc: 'Hover jump, burst flash' },
    { id: 'confident', label: 'Confident', desc: 'Wings extended, chest puff' },
    { id: 'curious', label: 'Curious', desc: 'Figure-eight hover' },
    { id: 'sleepy', label: 'Sleepy', desc: 'Wings droop, soft fade' }
  ];

  const activeEmotion = currentEmotion || emotion;

  // Size configurations
  const sizes = {
    small: { width: 160, height: 180, scale: 0.5 },
    medium: { width: 240, height: 270, scale: 0.75 },
    large: { width: 320, height: 360, scale: 1 }
  };

  const sizeConfig = sizes[size] || sizes.medium;

  const getEyeStyle = () => {
    switch(activeEmotion) {
      case 'happy': return { scaleY: 0.5, transform: 'translateY(2px)' };
      case 'thinking': return { transform: 'translateY(-3px)' };
      case 'confused': return { transform: 'rotate(-10deg) translateX(-2px)' };
      case 'surprised': return { scale: 1.3 };
      case 'sleepy': return { scaleY: 0.2, transform: 'translateY(4px)' };
      case 'listening': return { scale: 1.2 };
      case 'confident': return { scaleY: 0.6, transform: 'translateY(1px)' };
      case 'curious': return { scale: 1.1 };
      default: return {};
    }
  };

  const getBodyAnimation = () => {
    switch(activeEmotion) {
      case 'happy': return 'animate-bounce';
      case 'excited': return 'animate-bounce';
      case 'sleepy': return 'lumo-sleepy-sway';
      case 'encouraging': return 'lumo-gentle-nod';
      case 'curious': return 'lumo-figure-eight';
      case 'confident': return 'lumo-confident-puff';
      default: return '';
    }
  };

  const getTailGlow = () => {
    switch(activeEmotion) {
      case 'excited': return 'brightness-200 lumo-tail-flash';
      case 'confident': return 'brightness-150 lumo-tail-steady';
      case 'sleepy': return 'brightness-40 opacity-50 lumo-tail-fade';
      case 'thinking': return 'animate-pulse';
      case 'encouraging': return 'brightness-125 lumo-tail-sparkle';
      case 'listening': return 'brightness-110 lumo-tail-warm';
      default: return 'brightness-100';
    }
  };

  const getWingPosition = () => {
    switch(activeEmotion) {
      case 'confused': return { rotation: -5, droop: true };
      case 'excited': return { rotation: -35, flutter: true };
      case 'confident': return { rotation: -25, extended: true };
      case 'sleepy': return { rotation: -5, droop: true, opacity: 0.3 };
      case 'listening': return { rotation: -10, fold: true };
      default: return { rotation: -15, flutter: false };
    }
  };

  const getBodyPosition = () => {
    switch(activeEmotion) {
      case 'confident': return { scale: 1.1, y: -5 };
      case 'sleepy': return { scale: 0.95, y: 10 };
      case 'encouraging': return { y: -3 };
      case 'listening': return { y: -2 };
      case 'curious': return { rotation: 5 };
      default: return {};
    }
  };

  return (
    <div className="lumo-container" style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className={`lumo-display ${getBodyAnimation()}`} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <svg width={sizeConfig.width} height={sizeConfig.height} viewBox="0 0 320 360" style={{ display: 'block' }}>
          {/* Glow effect */}
          <defs>
            <radialGradient id={`bodyGradient-${activeEmotion}`} cx="50%" cy="30%">
              <stop offset="0%" stopColor="#78E08F" stopOpacity="1" />
              <stop offset="70%" stopColor="#60A5FA" stopOpacity="1" />
              <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.9" />
            </radialGradient>

            <radialGradient id={`tailGlow-${activeEmotion}`} cx="50%" cy="50%">
              <stop offset="0%" stopColor="#FFE16B" stopOpacity="1" />
              <stop offset="50%" stopColor="#FCD34D" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
            </radialGradient>

            <filter id={`softGlow-${activeEmotion}`}>
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <filter id={`strongGlow-${activeEmotion}`}>
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Ambient glow behind firefly */}
          <circle
            cx="160"
            cy="160"
            r="100"
            fill={`url(#tailGlow-${activeEmotion})`}
            opacity="0.3"
            className={getTailGlow()}
            filter={`url(#strongGlow-${activeEmotion})`}
          />

          {/* Wings Group - Back Layer */}
          <g style={{ '--rotation': `${getWingPosition().rotation}deg` }}>
            <ellipse
              cx="115"
              cy="140"
              rx="35"
              ry="55"
              fill="white"
              opacity={getWingPosition().droop ? 0.1 : 0.15}
              style={{ transformOrigin: '115px 140px', transform: `rotate(${getWingPosition().rotation - 5}deg)` }}
              className={activeEmotion === 'excited' ? 'lumo-wing-flutter' : activeEmotion === 'confused' ? 'lumo-wing-twitch' : activeEmotion === 'thinking' ? 'animate-pulse' : ''}
              filter={`url(#softGlow-${activeEmotion})`}
            />

            <ellipse
              cx="205"
              cy="140"
              rx="35"
              ry="55"
              fill="white"
              opacity={getWingPosition().droop ? 0.1 : 0.15}
              style={{ transformOrigin: '205px 140px', transform: `rotate(${-(getWingPosition().rotation - 5)}deg)` }}
              className={activeEmotion === 'excited' ? 'lumo-wing-flutter' : activeEmotion === 'confused' ? 'lumo-wing-twitch' : activeEmotion === 'thinking' ? 'animate-pulse' : ''}
              filter={`url(#softGlow-${activeEmotion})`}
            />
          </g>

          {/* Body - Main gradient with position */}
          <g style={{
            transform: `scale(${getBodyPosition().scale || 1}) translateY(${getBodyPosition().y || 0}px) rotate(${getBodyPosition().rotation || 0}deg)`,
            transformOrigin: '160px 145px'
          }}>
            <ellipse
              cx="160"
              cy="145"
              rx="48"
              ry="58"
              fill={`url(#bodyGradient-${activeEmotion})`}
              filter={`url(#softGlow-${activeEmotion})`}
            />

            {/* Head - Softer circle */}
            <circle
              cx="160"
              cy="100"
              r="42"
              fill={`url(#bodyGradient-${activeEmotion})`}
              filter={`url(#softGlow-${activeEmotion})`}
            />
          </g>

          {/* Tail segments with glow */}
          <g className={getTailGlow()} style={{ transformOrigin: '160px 215px' }}>
            <ellipse cx="160" cy="200" rx="30" ry="12" fill="#FFE16B" opacity="0.9" filter={`url(#strongGlow-${activeEmotion})`} />
            <ellipse cx="160" cy="213" rx="26" ry="10" fill="#FCD34D" opacity="0.85" filter={`url(#strongGlow-${activeEmotion})`} />
            <ellipse cx="160" cy="224" rx="22" ry="9" fill="#FBBF24" opacity="0.8" filter={`url(#strongGlow-${activeEmotion})`} />
            <ellipse cx="160" cy="234" rx="18" ry="8" fill="#F59E0B" opacity="0.7" filter={`url(#strongGlow-${activeEmotion})`} />
          </g>

          {/* Antennae with listening animation */}
          <g className={activeEmotion === 'listening' ? 'lumo-antenna-listen' : ''} style={{ transformOrigin: '145px 75px' }}>
            <line x1="145" y1="75" x2="140" y2="55" stroke="#60A5FA" strokeWidth="3" strokeLinecap="round" />
            <circle cx="140" cy="55" r="4" fill="#78E08F" />
          </g>
          <g className={activeEmotion === 'listening' ? 'lumo-antenna-listen' : ''} style={{ transformOrigin: '175px 75px' }}>
            <line x1="175" y1="75" x2="180" y2="55" stroke="#60A5FA" strokeWidth="3" strokeLinecap="round" />
            <circle cx="180" cy="55" r="4" fill="#78E08F" />
          </g>

          {/* Eyes - Dynamic */}
          <g style={getEyeStyle()} className="transition-all duration-300">
            {/* Left Eye */}
            <g>
              <ellipse cx="145" cy="95" rx="12" ry="16" fill="white" />
              {activeEmotion === 'confused' ? (
                // Swirly confused eyes
                <g className="lumo-swirl-confused" style={{ transformOrigin: '145px 98px' }}>
                  <circle cx="142" cy="96" r="3" fill="#1e293b" />
                  <circle cx="148" cy="100" r="3" fill="#1e293b" />
                </g>
              ) : (
                <>
                  <ellipse cx="145" cy="98" rx="7" ry="10" fill="#1e293b" />
                  <ellipse cx="147" cy="95" rx="3" ry="4" fill="white" opacity="0.8" />
                </>
              )}
            </g>

            {/* Right Eye */}
            <g>
              <ellipse cx="175" cy="95" rx="12" ry="16" fill="white" />
              {activeEmotion === 'confused' ? (
                // Swirly confused eyes
                <g className="lumo-swirl-confused" style={{ transformOrigin: '175px 98px' }}>
                  <circle cx="172" cy="96" r="3" fill="#1e293b" />
                  <circle cx="178" cy="100" r="3" fill="#1e293b" />
                </g>
              ) : (
                <>
                  <ellipse cx="175" cy="98" rx="7" ry="10" fill="#1e293b" />
                  <ellipse cx="177" cy="95" rx="3" ry="4" fill="white" opacity="0.8" />
                </>
              )}
            </g>
          </g>

          {/* Mouth */}
          {activeEmotion === 'happy' && (
            <path d="M 150 110 Q 160 118 170 110" stroke="#1e293b" strokeWidth="2" fill="none" strokeLinecap="round" />
          )}
          {activeEmotion === 'surprised' && (
            <ellipse cx="160" cy="112" rx="6" ry="8" fill="#1e293b" />
          )}
          {activeEmotion === 'confident' && (
            <path d="M 150 108 Q 160 114 170 108" stroke="#1e293b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          )}
          {activeEmotion === 'sleepy' && (
            <line x1="152" y1="110" x2="168" y2="110" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
          )}

          {/* Special effects */}
          {activeEmotion === 'confused' && (
            <>
              <text x="190" y="80" fontSize="28" fill="#FFE16B" opacity="0.9" fontWeight="bold">?</text>
              <text x="200" y="70" fontSize="22" fill="#FCD34D" opacity="0.7" fontWeight="bold">?</text>
              <text x="120" y="85" fontSize="20" fill="#60A5FA" opacity="0.6">?</text>
            </>
          )}
          {activeEmotion === 'excited' && (
            <>
              <circle cx="120" cy="110" r="4" fill="#FFE16B" opacity="0.9">
                <animate attributeName="opacity" values="0.9;0.2;0.9" dur="0.4s" repeatCount="indefinite" />
                <animate attributeName="r" values="4;6;4" dur="0.4s" repeatCount="indefinite" />
              </circle>
              <circle cx="200" cy="110" r="4" fill="#FFE16B" opacity="0.9">
                <animate attributeName="opacity" values="0.2;0.9;0.2" dur="0.4s" repeatCount="indefinite" />
                <animate attributeName="r" values="4;6;4" dur="0.4s" repeatCount="indefinite" />
              </circle>
              <circle cx="110" cy="140" r="3" fill="#FCD34D" opacity="0.8">
                <animate attributeName="cy" from="140" to="110" dur="0.6s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.8" to="0" dur="0.6s" repeatCount="indefinite" />
              </circle>
              <circle cx="210" cy="140" r="3" fill="#FCD34D" opacity="0.8">
                <animate attributeName="cy" from="140" to="110" dur="0.6s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.8" to="0" dur="0.6s" repeatCount="indefinite" />
              </circle>
              <circle cx="160" cy="75" r="3" fill="#78E08F" opacity="0.7">
                <animate attributeName="r" values="3;5;3" dur="0.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.7;0.3;0.7" dur="0.5s" repeatCount="indefinite" />
              </circle>
            </>
          )}
          {activeEmotion === 'encouraging' && (
            <>
              <circle cx="130" cy="120" r="3" fill="#FFE16B" opacity="0.7">
                <animate attributeName="opacity" values="0.7;0.3;0.7" dur="1.5s" repeatCount="indefinite" />
              </circle>
              <circle cx="190" cy="120" r="3" fill="#FFE16B" opacity="0.7">
                <animate attributeName="opacity" values="0.3;0.7;0.3" dur="1.5s" repeatCount="indefinite" />
              </circle>
              <circle cx="120" cy="145" r="2" fill="#FCD34D" opacity="0.6">
                <animate attributeName="cy" from="145" to="125" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx="200" cy="145" r="2" fill="#FCD34D" opacity="0.6">
                <animate attributeName="cy" from="145" to="125" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx="160" cy="130" r="2" fill="#78E08F" opacity="0.5">
                <animate attributeName="cy" from="130" to="110" dur="2.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.5" to="0" dur="2.5s" repeatCount="indefinite" />
              </circle>
            </>
          )}
          {activeEmotion === 'listening' && (
            <>
              <path d="M 125 65 Q 120 60 115 55" stroke="#60A5FA" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6">
                <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1s" repeatCount="indefinite" />
              </path>
              <path d="M 195 65 Q 200 60 205 55" stroke="#60A5FA" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6">
                <animate attributeName="opacity" values="0.2;0.6;0.2" dur="1s" repeatCount="indefinite" />
              </path>
              <circle cx="135" cy="60" r="2" fill="#78E08F" opacity="0.7">
                <animate attributeName="r" values="2;4;2" dur="1s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.7;0.2;0.7" dur="1s" repeatCount="indefinite" />
              </circle>
              <circle cx="185" cy="60" r="2" fill="#78E08F" opacity="0.7">
                <animate attributeName="r" values="2;4;2" dur="1s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.2;0.7;0.2" dur="1s" repeatCount="indefinite" />
              </circle>
            </>
          )}
          {activeEmotion === 'confident' && (
            <>
              <circle cx="160" cy="130" r="70" stroke="#FFE16B" strokeWidth="2" fill="none" opacity="0.3">
                <animate attributeName="r" values="70;75;70" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.3;0.15;0.3" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx="160" cy="130" r="60" stroke="#78E08F" strokeWidth="1.5" fill="none" opacity="0.2">
                <animate attributeName="r" values="60;63;60" dur="2s" repeatCount="indefinite" />
              </circle>
            </>
          )}
          {activeEmotion === 'curious' && (
            <>
              <circle cx="160" cy="130" r="2" fill="#60A5FA" opacity="0.4">
                <animateMotion dur="3s" repeatCount="indefinite"
                  path="M 0,0 Q 8,-5 0,-8 Q -8,-5 0,0" />
                <animate attributeName="opacity" values="0.4;0.1;0.4" dur="3s" repeatCount="indefinite" />
              </circle>
              <circle cx="160" cy="130" r="2" fill="#78E08F" opacity="0.3">
                <animateMotion dur="3s" repeatCount="indefinite" begin="0.5s"
                  path="M 0,0 Q 8,-5 0,-8 Q -8,-5 0,0" />
                <animate attributeName="opacity" values="0.3;0.1;0.3" dur="3s" repeatCount="indefinite" />
              </circle>
            </>
          )}
          {activeEmotion === 'sleepy' && (
            <>
              <text x="190" y="100" fontSize="20" fill="#60A5FA" opacity="0.6">Z
                <animate attributeName="y" from="100" to="60" dur="3s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.6" to="0" dur="3s" repeatCount="indefinite" />
              </text>
              <text x="200" y="110" fontSize="16" fill="#60A5FA" opacity="0.5">z
                <animate attributeName="y" from="110" to="70" dur="3s" begin="1s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.5" to="0" dur="3s" begin="1s" repeatCount="indefinite" />
              </text>
              <text x="185" y="120" fontSize="14" fill="#60A5FA" opacity="0.4">z
                <animate attributeName="y" from="120" to="80" dur="3s" begin="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.4" to="0" dur="3s" begin="2s" repeatCount="indefinite" />
              </text>
            </>
          )}

          {/* Wings Group - Front Layer */}
          <g style={{ '--rotation': `${getWingPosition().rotation}deg` }}>
            <ellipse
              cx="125"
              cy="135"
              rx="32"
              ry="50"
              fill="white"
              opacity={getWingPosition().droop ? 0.15 : getWingPosition().extended ? 0.35 : 0.25}
              style={{ transformOrigin: '125px 135px', transform: `rotate(${getWingPosition().rotation - 10}deg)` }}
              className={activeEmotion === 'excited' ? 'lumo-wing-flutter' : activeEmotion === 'confused' ? 'lumo-wing-twitch' : activeEmotion === 'thinking' ? 'animate-pulse' : ''}
              filter={`url(#softGlow-${activeEmotion})`}
            />

            <ellipse
              cx="195"
              cy="135"
              rx="32"
              ry="50"
              fill="white"
              opacity={getWingPosition().droop ? 0.15 : getWingPosition().extended ? 0.35 : 0.25}
              style={{ transformOrigin: '195px 135px', transform: `rotate(${-(getWingPosition().rotation - 10)}deg)` }}
              className={activeEmotion === 'excited' ? 'lumo-wing-flutter' : activeEmotion === 'confused' ? 'lumo-wing-twitch' : activeEmotion === 'thinking' ? 'animate-pulse' : ''}
              filter={`url(#softGlow-${activeEmotion})`}
            />
          </g>
        </svg>
      </div>

      {/* Optional Controls */}
      {showControls && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-2">
          {emotions.map((em) => (
            <button
              key={em.id}
              onClick={() => setCurrentEmotion(em.id)}
              className={`p-3 rounded-lg border-2 transition-all text-sm ${
                currentEmotion === em.id
                  ? 'bg-brand-500/20 border-brand-400 text-brand-900'
                  : 'bg-white/50 border-neutral-200 text-neutral-700 hover:bg-brand-50'
              }`}
            >
              <div className="font-semibold mb-1">{em.label}</div>
              <div className="text-xs opacity-70">{em.desc}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LumoMascot;

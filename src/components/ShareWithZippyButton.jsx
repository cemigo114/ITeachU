import { motion, AnimatePresence } from 'motion/react';
import { Eye, Sparkles } from 'lucide-react';

export function ShareWithZippyButton({ visible, onClick, position = 'floating' }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClick}
          className={`
            ${position === 'floating' ? 'absolute top-4 right-4' : 'fixed bottom-8 right-8'}
            z-50 group
            flex items-center gap-2.5
            px-5 py-3
            bg-gradient-to-r from-[#00A896] to-[#0A4D8C]
            text-white font-medium text-sm
            rounded-full
            shadow-lg hover:shadow-xl
            border-2 border-white/20
            transition-all duration-300
          `}
        >
          <motion.div
            className="absolute inset-0 rounded-full bg-[#00A896]/30"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: 'easeInOut',
            }}
          />

          <div className="relative">
            <Eye className="w-4 h-4" />
          </div>

          <span className="relative">Share with Zippy</span>

          <motion.div
            className="relative"
            animate={{
              rotate: [0, 15, -15, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 3,
              ease: 'easeInOut',
            }}
          >
            <Sparkles className="w-3.5 h-3.5 fill-white/80" />
          </motion.div>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export function WatchingIndicator({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          className="absolute top-4 left-4 z-40"
        >
          <div className="flex items-center gap-2 px-4 py-2 bg-white/95 backdrop-blur-sm rounded-full shadow-md border border-gray-200">
            <div className="relative flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 bg-[#00A896] rounded-full"
                  animate={{
                    y: [0, -4, 0],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.2,
                    delay: i * 0.2,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>
            <span className="text-xs font-medium text-gray-600">Zippy watching</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

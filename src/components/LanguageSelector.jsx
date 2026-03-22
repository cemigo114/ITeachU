import React from 'react';

const LanguageSelector = ({ language, setLanguage }) => {
  return (
    <div className="flex gap-1.5 items-center">
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all duration-200 ${
          language === 'en'
            ? 'bg-white/20 text-white shadow-sm'
            : 'text-white/60 hover:text-white hover:bg-white/10'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage('es')}
        className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all duration-200 ${
          language === 'es'
            ? 'bg-white/20 text-white shadow-sm'
            : 'text-white/60 hover:text-white hover:bg-white/10'
        }`}
      >
        ES
      </button>
    </div>
  );
};

export default LanguageSelector;

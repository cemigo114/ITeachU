import React from 'react';

const LanguageSelector = ({ language, setLanguage }) => {
  return (
    <div className="flex gap-2 items-center">
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${
          language === 'en'
            ? 'bg-indigo-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage('es')}
        className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${
          language === 'es'
            ? 'bg-indigo-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        ES
      </button>
    </div>
  );
};

export default LanguageSelector;

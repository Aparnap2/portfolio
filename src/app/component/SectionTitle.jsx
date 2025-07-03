import React from 'react';
import { spaceGrotesk } from '../fonts';

const SectionTitle = ({ title, subtitle, className = '' }) => (
  <div className={`text-center mb-12 p-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl ${className}`}>
    <h2 className={`text-3xl sm:text-4xl font-bold text-white mb-4 ${spaceGrotesk.className}`}>{title}</h2>
    <p className="text-lg text-gray-300 max-w-3xl mx-auto">{subtitle}</p>
  </div>
);

export default SectionTitle;

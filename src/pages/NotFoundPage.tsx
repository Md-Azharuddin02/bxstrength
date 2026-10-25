import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => (
  <div className="bg-[#0a0a0a] min-h-[60vh] flex items-center justify-center p-6 text-center text-white">
    <div className="space-y-4">
      <p className="text-[#CCFF00] text-xs font-black uppercase tracking-widest">ERROR 404</p>
      <h1 className="text-3xl sm:text-5xl font-black uppercase">PAGE NOT FOUND</h1>
      <p className="text-sm text-zinc-400">This page does not exist or has moved.</p>
      <Link
        to="/"
        className="inline-block bg-[#CCFF00] text-black text-xs font-black uppercase px-6 py-3 rounded-xl"
      >
        BACK TO HOME
      </Link>
    </div>
  </div>
);
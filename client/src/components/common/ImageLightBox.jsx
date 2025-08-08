import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';

const ImageLightbox = ({ src, alt, onClose }) => {
  if (!src) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4"
      onClick={onClose} 
    >
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-white/20 rounded-full text-white hover:bg-white/40"
      >
        <XMarkIcon className="h-8 w-8" />
      </button>
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <img 
          src={src} 
          alt={alt} 
          className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl"
        />
      </div>
    </div>
  );
};

export default ImageLightbox;

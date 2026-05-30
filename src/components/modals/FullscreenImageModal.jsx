import React from "react";

export const FullscreenImageModal = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-[100] p-4 animate-fadeIn">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white text-4xl font-light z-[101] p-3 rounded-full hover:bg-gray-800 transition-colors"
        title="Tutup (Esc)"
      >
        &times;
      </button>
      <div className="w-full h-full flex items-center justify-center">
        <img
          src={imageUrl}
          alt="Fullscreen Trade Screenshot"
          className="max-w-full max-h-full object-contain"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src =
              "https://placehold.co/1200x800/374151/ffffff?text=Image+Gagal+Load";
          }}
        />
      </div>
    </div>
  );
};

export default FullscreenImageModal;

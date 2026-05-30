import React, { useState } from "react";
import { Users, ChevronDown } from "lucide-react";

export const ProfileSelector = ({
  profiles,
  activeProfile,
  onSelectProfile,
  onManageProfiles,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (e, profile) => {
    e.preventDefault();
    onSelectProfile(profile);
    setIsOpen(false);
  };

  if (!activeProfile) {
    return (
      <div className="text-gray-900 dark:text-white">Memuat profil...</div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 w-full text-left"
      >
        <Users size={20} className="text-blue-500 dark:text-blue-400 font-semibold" />
        <div className="flex-grow">
          <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
            {activeProfile.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {activeProfile.description || "Tidak ada deskripsi"}
          </p>
        </div>
        <ChevronDown
          size={16}
          className={`transition-transform text-gray-600 dark:text-gray-400 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-20">
          <ul>
            {profiles.map((p) => (
              <li key={p.id}>
                <a
                  href="#"
                  onClick={(e) => handleSelect(e, p)}
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {p.name}{" "}
                  <span className="text-xs text-gray-500">({p.currency})</span>
                </a>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={() => {
                  onManageProfiles();
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-blue-500 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 border-t border-gray-200 dark:border-gray-700 font-medium"
              >
                Tambah/Kelola Akun...
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ProfileSelector;

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

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

  const getInitials = (name) => {
    if (!name) return "";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  const renderAvatar = (profile, size = "w-10 h-10 text-xs") => {
    if (!profile) return null;
    if (profile.avatar) {
      return (
        <img
          src={profile.avatar}
          alt={profile.name || ""}
          className={`${size} rounded-full object-cover border border-white/20 shadow-md`}
        />
      );
    }
    const initials = getInitials(profile.name || "");
    return (
      <div
        className={`${size} rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center font-bold text-white tracking-wider border border-white/10 shadow-md`}
      >
        {initials}
      </div>
    );
  };

  if (!activeProfile) {
    return (
      <div className="text-gray-900 dark:text-white text-sm font-medium animate-pulse">
        Memuat profil...
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 bg-white/5 dark:bg-gray-800/40 backdrop-blur-md p-2.5 rounded-xl border border-gray-200/10 dark:border-gray-700/30 hover:border-indigo-500/40 hover:bg-white/10 dark:hover:bg-gray-800/60 hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] transition-all duration-300 w-full text-left"
      >
        {renderAvatar(activeProfile, "w-9 h-9 text-xs")}
        <div className="flex-grow min-w-0">
          <p className="font-semibold text-gray-900 dark:text-white text-sm truncate leading-tight">
            {activeProfile.name}
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5 font-medium leading-none">
            {activeProfile.description || "Tidak ada deskripsi"}
          </p>
        </div>
        <ChevronDown
          size={16}
          className={`transition-transform duration-300 text-gray-500 dark:text-gray-400 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800/95 backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-2xl z-20 overflow-hidden animate-fadeIn max-h-[300px] overflow-y-auto">
            <div className="px-3 py-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-100 dark:border-gray-700/30">
              Pilih Profil Trading
            </div>
            <ul className="py-1">
              {profiles.map((p) => {
                const isActive = p.id === activeProfile.id;
                return (
                  <li key={p.id}>
                    <a
                      href="#"
                      onClick={(e) => handleSelect(e, p)}
                      className={`flex items-center space-x-3 px-3 py-2.5 text-sm transition-all duration-200 ${
                        isActive
                          ? "bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-700/50"
                      }`}
                    >
                      {renderAvatar(p, "w-8 h-8 text-[10px]")}
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="truncate block font-semibold">{p.name}</span>
                          <span className="text-[10px] bg-gray-200/55 dark:bg-gray-700/50 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400 font-medium">
                            {p.currency}
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-400 dark:text-gray-500 truncate block mt-0.5 font-normal">
                          {p.description || "Tidak ada deskripsi"}
                        </span>
                      </div>
                    </a>
                  </li>
                );
              })}
              <li className="border-t border-gray-100 dark:border-gray-700/40 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    onManageProfiles();
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-indigo-500 dark:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-700/30 font-semibold transition-colors flex items-center justify-center space-x-2"
                >
                  <span>Tambah / Kelola Akun</span>
                </button>
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default ProfileSelector;

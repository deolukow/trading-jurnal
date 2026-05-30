import React from "react";

export const SidebarLink = ({ icon, text, active, onClick }) => (
  <li className="mb-2">
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`flex items-center p-3 rounded-lg transition-colors ${
        active
          ? "bg-blue-600 text-white"
          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
      }`}
    >
      {icon}
      <span className="ml-3">{text}</span>
    </a>
  </li>
);

export default SidebarLink;

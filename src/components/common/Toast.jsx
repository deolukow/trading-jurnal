import React from "react";
import { CheckCircle, AlertTriangle, Info } from "lucide-react";

export const Toast = ({ message, type, onClose }) => {
  if (!message) return null;
  let style;
  switch (type) {
    case "success":
      style = { bg: "bg-green-600", icon: <CheckCircle /> };
      break;
    case "error":
      style = { bg: "bg-red-600", icon: <AlertTriangle /> };
      break;
    case "info":
      style = { bg: "bg-blue-600", icon: <Info /> };
      break;
    default:
      style = { bg: "bg-gray-700", icon: <Info /> };
      break;
  }
  return (
    <div
      className={`fixed top-5 right-5 ${style.bg} text-white p-4 rounded-lg shadow-xl flex items-center z-[100] animate-fadeIn`}
    >
      <div className="mr-3">{style.icon}</div>
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-4 text-2xl font-semibold leading-none hover:text-gray-200"
      >
        &times;
      </button>
    </div>
  );
};

export default Toast;

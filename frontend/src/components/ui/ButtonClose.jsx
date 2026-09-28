import React from "react";
import { ChevronLeft } from "lucide-react"; // Ícono de la imagen

export const CloseButton = ({ size = "md", theme = "light", onClick, ...props }) => {
const sizeClasses = {
    sm: "h-6 w-6 text-sm",
    md: "h-8 w-8 text-base",
    lg: "h-10 w-10 text-lg",
};

  // Estilo para que se vea sutil como en la imagen
const themeClasses = {
    light: "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
    dark: "text-gray-400 hover:bg-white/10 hover:text-white",
};

return (
    <button
    type="button"
    onClick={onClick}
    className={`flex items-center justify-center rounded-lg transition-all active:scale-95 focus:outline-none ${sizeClasses[size]} ${themeClasses[theme]}`}
    {...props}
    >
    <ChevronLeft className="h-6 w-6" />
    </button>
);
};
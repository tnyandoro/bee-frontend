import * as React from "react";

export const Badge = ({ children, variant = "default" }) => {
  const base = "inline-block px-2 py-1 text-xs font-semibold rounded";
  const variants = {
    default: "bg-gray-200 text-gray-800",
    destructive: "bg-red-500 text-white",
  };

  return <span className={`${base} ${variants[variant]}`}>{children}</span>;
};

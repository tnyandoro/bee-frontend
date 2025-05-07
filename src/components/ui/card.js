import * as React from "react";

export const Card = ({ children, className }) => (
  <div
    className={`bg-white border border-gray-200 rounded-xl shadow-sm ${
      className || ""
    }`}
  >
    {children}
  </div>
);

export const CardContent = ({ children, className }) => (
  <div className={`p-4 ${className || ""}`}>{children}</div>
);

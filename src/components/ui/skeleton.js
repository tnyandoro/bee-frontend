import * as React from "react";

export const Skeleton = ({ className }) => {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
};

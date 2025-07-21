// src/components/FullPageLoader.js
import React from "react";
import { Player } from "@lottiefiles/react-lottie-player";
import animationData from "../assets/loader.json";
import loader from "../assets/loader.json";

const FullPageLoader = () => {
  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center">
      <Player
        autoplay
        loop
        src={animationData}
        style={{ height: "200px", width: "200px" }}
      />
      <p className="mt-4 text-blue-600 text-lg font-semibold animate-pulse">
        Loading your experience...
      </p>
    </div>
  );
};

export default FullPageLoader;

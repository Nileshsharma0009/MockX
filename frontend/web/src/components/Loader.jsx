import React from "react";

const Loader = () => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm">

      {/* Spinner Container */}
      <div className="relative flex items-center justify-center">

        {/* Soft background ring */}
        <div className="w-16 h-16 border border-slate-200 rounded-full animate-pulse"></div>

        {/* Rotating arc */}
        <div className="absolute w-16 h-16 border-[3px] border-transparent border-t-slate-800 rounded-full animate-spin"></div>

        {/* Inner breathing dot */}
        <div className="absolute w-2.5 h-2.5 bg-slate-700 rounded-full animate-[pulse_2s_ease-in-out_infinite]"></div>

      </div>

      {/* Branding */}
      <div className="mt-8 flex flex-col items-center space-y-1 animate-[fadeIn_1.2s_ease]">

        <h2 className="text-[20px] font-semibold tracking-[0.35em] text-slate-800 uppercase">
          MockX
        </h2>

        <p className="text-[15px] text-slate-400 tracking-widest uppercase">
          Loading
        </p>

      </div>

    </div>
  );
};

export default Loader;
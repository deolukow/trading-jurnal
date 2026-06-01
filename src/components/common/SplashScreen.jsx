import React from "react";

/**
 * Premium Animated Splash Screen for WzGold Trading Jurnal
 * Features:
 * - Ambient radial glow backgrounds (Gold & Violet theme matching index.css)
 * - Elastic scale entrance for "WzGold" text
 * - Self-expanding golden-gradient divider line
 * - Slide & fade reveal for "Trading Jurnal" text
 * - Sleek, futuristic pulsing scanning bar
 * - Sophisticated developer credit entrance with kinetic tracking (letter-spacing)
 * - Cinematic Split-curtain (sliding door) reveal transition to the main app
 *
 * @param {Object} props
 * @param {boolean} props.fadeOut - Triggers the split sliding curtain opening effect
 */
export function SplashScreen({ fadeOut }) {
  return (
    <div
      className={`fixed inset-0 z-[9999] select-none overflow-hidden ${
        fadeOut ? "pointer-events-none" : ""
      }`}
    >
      {/* Inject custom advanced CSS keyframes directly for robust execution and perfect bezier curves */}
      <style>{`
        @keyframes ambient-pulse-gold {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.4; }
          50% { transform: translate(-50%, -50%) scale(1.08); opacity: 0.6; }
        }
        @keyframes ambient-pulse-violet {
          0%, 100% { transform: translate(10%, -60%) scale(1); opacity: 0.3; }
          50% { transform: translate(10%, -60%) scale(1.05); opacity: 0.5; }
        }
        @keyframes logo-scale-in {
          0% { transform: scale(0.85); opacity: 0; filter: blur(8px); }
          60% { transform: scale(1.02); opacity: 0.9; filter: blur(0); }
          100% { transform: scale(1); opacity: 1; filter: blur(0); }
        }
        @keyframes divider-grow {
          0% { transform: scaleY(0); opacity: 0; }
          40% { opacity: 0.5; }
          100% { transform: scaleY(1); opacity: 1; }
        }
        @keyframes text-slide-reveal {
          0% { opacity: 0; transform: translateX(-20px); filter: blur(4px); }
          100% { opacity: 1; transform: translateX(0); filter: blur(0); }
        }
        @keyframes scan-bar-flow {
          0% { left: -100%; }
          100% { left: 200%; }
        }
        @keyframes fade-in-delayed {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes footer-kinetic {
          0% { opacity: 0; transform: translateY(20px); letter-spacing: 0.1em; }
          100% { opacity: 1; transform: translateY(0); letter-spacing: 0.25em; }
        }

        .animate-ambient-gold {
          animation: ambient-pulse-gold 6s ease-in-out infinite;
        }
        .animate-ambient-violet {
          animation: ambient-pulse-violet 8s ease-in-out infinite;
        }
        .animate-logo-scale {
          animation: logo-scale-in 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-divider-grow {
          animation: divider-grow 1s cubic-bezier(0.85, 0, 0.15, 1) 0.3s forwards;
        }
        .animate-text-slide {
          animation: text-slide-reveal 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.8s forwards;
        }
        .animate-scan-bar {
          animation: scan-bar-flow 2.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .animate-fade-delayed {
          animation: fade-in-delayed 1.2s ease-out 1s forwards;
        }
        .animate-footer {
          animation: footer-kinetic 1.4s cubic-bezier(0.16, 1, 0.3, 1) 0.6s forwards;
        }
      `}</style>

      {/* Split Doors - Left and Right half panels */}
      <div
        className={`absolute top-0 bottom-0 left-0 w-1/2 bg-[#050607] border-r border-gray-900/10 transition-transform duration-[850ms] z-10 ${
          fadeOut ? "translate-x-[-100%]" : "translate-x-0"
        }`}
        style={{ transitionTimingFunction: "cubic-bezier(0.77, 0, 0.175, 1)" }}
      />
      <div
        className={`absolute top-0 bottom-0 right-0 w-1/2 bg-[#050607] border-l border-gray-900/10 transition-transform duration-[850ms] z-10 ${
          fadeOut ? "translate-x-[100%]" : "translate-x-0"
        }`}
        style={{ transitionTimingFunction: "cubic-bezier(0.77, 0, 0.175, 1)" }}
      />

      {/* Center Content Overlay */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center z-20 transition-all duration-[350ms] ease-in-out ${
          fadeOut ? "opacity-0 scale-[0.97] filter blur-sm" : "opacity-100 scale-100"
        }`}
      >
        {/* Ambient background glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full bg-amber-500/[0.04] blur-[100px] pointer-events-none animate-ambient-gold" />
        <div className="absolute top-1/2 left-1/2 translate-x-[20%] -translate-y-[60%] w-[450px] h-[450px] rounded-full bg-violet-600/[0.04] blur-[90px] pointer-events-none animate-ambient-violet" />

        {/* Center Logo Group */}
        <div className="flex items-center justify-center scale-95 opacity-0 animate-logo-scale">
          
          {/* Left Brand Mark: WzGold */}
          <div className="flex items-center text-4xl sm:text-5xl font-black italic tracking-tighter text-white">
            <span>Wz</span>
            <span className="text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.55)] ml-0.5">
              Gold
            </span>
          </div>

          {/* Dynamic Vertical Divider Line */}
          <div className="w-[1.5px] h-10 bg-gradient-to-b from-transparent via-amber-400/80 to-transparent mx-4 sm:mx-5 scale-y-0 opacity-0 animate-divider-grow" />

          {/* Right Brand Mark: Trading Jurnal */}
          <div className="flex flex-col justify-center leading-none text-left opacity-0 animate-text-slide">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.22em] text-gray-400">
              Trading
            </span>
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.22em] text-violet-400 mt-1 drop-shadow-[0_0_8px_rgba(167,139,250,0.35)]">
              Jurnal
            </span>
          </div>
        </div>

        {/* Sleek Scanning Bar Loader */}
        <div className="w-40 h-[1.5px] bg-gray-900 rounded-full mt-10 overflow-hidden relative opacity-0 animate-fade-delayed">
          <div className="absolute top-0 bottom-0 left-0 w-2/5 bg-gradient-to-r from-transparent via-amber-400 to-transparent rounded-full animate-scan-bar" />
        </div>

        {/* Developed By Credit */}
        <div className="absolute bottom-12 flex flex-col items-center opacity-0 animate-footer">
          <span className="text-[9px] text-gray-500 tracking-[0.35em] font-semibold uppercase mb-2">
            Developed By
          </span>
          <div className="text-[11px] tracking-[0.2em] font-black uppercase text-white flex items-center">
            <span>Deo</span>
            <span className="text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.35)] ml-1">
              Lukow
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

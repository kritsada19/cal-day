"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import { logger } from "@/lib/logger";

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      const res = await axios.post("/api/checkout");
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (error) {
      logger.error({ err: error }, "Subscription error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian-950 flex flex-col items-center py-20 px-4">
      {/* Decorative Title Area */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold tracking-[0.3em] text-white font-sans mb-4">
          SUBSCRIPTION
        </h1>
        <div className="h-px w-32 bg-linear-to-r from-transparent via-gold-accent to-transparent mx-auto"></div>
      </div>

      {/* Subscription Card Container */}
      <div className="max-w-md w-full bg-obsidian-900 border border-white/10 p-8 relative group transition-all duration-500 hover:border-gold-accent/40 shadow-xl">
        {/* Corner Decors for sharp geometric look */}
        <span className="absolute -top-px -left-px w-3 h-3 border-t border-l border-gold-accent transition-all duration-300"></span>
        <span className="absolute -bottom-px -right-px w-3 h-3 border-b border-r border-gold-accent transition-all duration-300"></span>
        
        {/* Subtle background glow effect */}
        <div className="absolute inset-0 bg-gold-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

        <div className="text-center mb-10 relative z-10">
          <h2 className="text-xl font-bold tracking-[0.2em] text-gold-accent font-sans mb-2">
            PREMIUM ACCESS
          </h2>
          <p className="text-xs text-white/50 font-mono tracking-widest">
            UNLOCK YOUR FULL POTENTIAL
          </p>
        </div>

        {/* Feature List */}
        <div className="space-y-6 mb-12 relative z-10">
          {[
            "UNLIMITED MEAL LOGGING",
            "ADVANCED ANALYTICS & INSIGHTS",
            "CUSTOM MACRO TARGETS",
            "PRIORITY CUSTOMER SUPPORT"
          ].map((feature, i) => (
            <div key={i} className="flex items-center gap-4 group/feature">
              {/* Custom checkbox/bullet */}
              <div className="w-5 h-5 flex items-center justify-center bg-obsidian-800 border border-white/20 group-hover/feature:border-gold-accent transition-colors duration-300">
                <div className="w-2 h-2 bg-gold-accent shadow-glow-gold opacity-80 group-hover/feature:opacity-100 transition-opacity duration-300"></div>
              </div>
              <span className="text-xs tracking-widest text-white/80 font-mono group-hover/feature:text-white transition-colors duration-300">
                {feature}
              </span>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div className="relative z-10">
          <button
            onClick={handleSubscribe}
            disabled={loading || !session}
            className="w-full relative bg-obsidian-800 border border-gold-accent text-gold-accent py-4 font-bold tracking-[0.2em] text-xs hover:bg-gold-accent hover:text-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group/btn overflow-hidden"
          >
            {/* Button hover effect line */}
            <span className="absolute bottom-0 left-0 w-0 h-px bg-white group-hover/btn:w-full transition-all duration-500"></span>
            
            <span className="relative z-10">
              {loading ? "INITIALIZING SEQUENCE..." : (!session ? "LOGIN REQUIRED" : "UPGRADE PROTOCOL")}
            </span>
          </button>
          
          {!session && (
            <p className="text-center text-[10px] text-white/40 font-mono tracking-wider mt-4">
              PLEASE LOG IN TO ACCESS PREMIUM FEATURES
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

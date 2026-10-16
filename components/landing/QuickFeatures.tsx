import React from "react";
import { Clock, Users, Trophy, Gift, Home, Sprout } from "lucide-react";

interface QuickFeatureItem {
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
  title: string;
  description: string;
}

const features: QuickFeatureItem[] = [
  {
    icon: <Clock className="w-5 h-5 text-[#3B7AE8]" />,
    bgColor: "bg-[#EAF2FF]",
    textColor: "text-[#3B7AE8]",
    title: "Live Study Timers",
    description: "See your friends study in real time",
  },
  {
    icon: <Users className="w-5 h-5 text-[#8852EC]" />,
    bgColor: "bg-[#F3EEFE]",
    textColor: "text-[#8852EC]",
    title: "Friends & Groups",
    description: "Add multiple friends and study together",
  },
  {
    icon: <Trophy className="w-5 h-5 text-[#D99B16]" />,
    bgColor: "bg-[#FFF8E5]",
    textColor: "text-[#D99B16]",
    title: "Daily Leaderboards",
    description: "Your 24-hour day, your rules",
  },
  {
    icon: <Gift className="w-5 h-5 text-[#E84E86]" />,
    bgColor: "bg-[#FFEBF2]",
    textColor: "text-[#E84E86]",
    title: "Virtual Gifts",
    description: "Send cute goodies and cheer them up",
  },
  {
    icon: <Home className="w-5 h-5 text-[#2B95E0]" />,
    bgColor: "bg-[#EBF7FF]",
    textColor: "text-[#2B95E0]",
    title: "Cozy Study Rooms",
    description: "Chat, focus, and vibe together",
  },
  {
    icon: <Sprout className="w-5 h-5 text-[#2EB562]" />,
    bgColor: "bg-[#ECF8F1]",
    textColor: "text-[#2EB562]",
    title: "Growing Companion",
    description: "The more you study, the happier they get!",
  },
];

export const QuickFeatures: React.FC = () => {
  return (
    <section className="py-8 bg-[#FFFDF9] border-y border-[#F3E8E2]/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {features.map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center text-center p-4 rounded-2xl bg-white border border-[#F0E6DE]/90 hover:border-[#E8D4DE] shadow-2xs hover:shadow-xs transition-all duration-200 group"
            >
              {/* Circular pastel vector icon */}
              <div
                className={`w-12 h-12 rounded-full ${item.bgColor} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
              >
                {item.icon}
              </div>

              {/* Title */}
              <h3 className="font-display text-xs sm:text-sm font-bold text-[#4A3E4D] mb-1">
                {item.title}
              </h3>

              {/* Subtitle */}
              <p className="text-[11px] sm:text-xs text-[#8C7B8E] leading-tight">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "cream" | "lavender" | "blush" | "butter" | "mint";
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = "cream",
  className = "",
  children,
  ...props
}) => {
  const variantStyles = {
    cream: "bg-white/80 dark:bg-[#241D33]/90 border-[#E9DFD8]/80 dark:border-[#40354F] text-[#4A3E4D] dark:text-[#F8F1FF]",
    lavender: "bg-[#E7E0FA]/60 dark:bg-[#302641] border-[#E7E0FA] dark:border-[#40354F] text-[#4A3E4D] dark:text-[#F8F1FF]",
    blush: "bg-[#FFEBF0]/60 dark:bg-[#4A263D]/60 border-[#FFD5DF] dark:border-[#6A3756] text-[#4A3E4D] dark:text-[#F8F1FF]",
    butter: "bg-[#FFF8E5]/70 dark:bg-[#45361D]/50 border-[#F9EDC7] dark:border-[#69522B] text-[#4A3E4D] dark:text-[#F8F1FF]",
    mint: "bg-[#DDEFE2]/60 dark:bg-[#1A3826]/60 border-[#DDEFE2] dark:border-[#2C5E3F] text-[#4A3E4D] dark:text-[#F8F1FF]",
  };

  return (
    <div
      className={`rounded-3xl border p-6 backdrop-blur-xs shadow-xs transition-all duration-200 hover:shadow-md ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

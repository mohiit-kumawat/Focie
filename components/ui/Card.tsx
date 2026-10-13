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
    cream: "bg-white/80 border-plum/10",
    lavender: "bg-lavender/60 border-lavender",
    blush: "bg-blush/50 border-blush",
    butter: "bg-butter/50 border-butter",
    mint: "bg-mint/50 border-mint",
  };

  return (
    <div
      className={`rounded-3xl border p-6 backdrop-blur-xs shadow-xs transition-shadow duration-200 hover:shadow-md ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

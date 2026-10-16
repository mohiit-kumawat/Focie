import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "mint" | "butter" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-semibold transition-all duration-200 cursor-pointer select-none active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF729F]";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs rounded-xl shadow-xs",
    md: "px-5 py-2.5 text-sm rounded-2xl shadow-sm",
    lg: "px-7 py-3 text-base rounded-3xl shadow-md",
  };

  const variantStyles = {
    primary:
      "bg-[#FF729F] text-white hover:bg-[#F25577] dark:hover:bg-[#FF5D8F] border border-[#FF729F] shadow-sm",
    secondary:
      "bg-[#E7E0FA] dark:bg-[#302641] text-[#4A3E4D] dark:text-[#F8F1FF] hover:bg-[#DAD1F5] dark:hover:bg-[#3E3154] border border-[#E7E0FA] dark:border-[#40354F]",
    mint: "bg-[#DDEFE2] dark:bg-[#1A3826] text-[#4A3E4D] dark:text-[#91E6C1] hover:bg-[#CAE6D2] dark:hover:bg-[#234C34] border border-[#DDEFE2] dark:border-[#2C5E3F]",
    butter:
      "bg-[#F9EDC7] dark:bg-[#45361D] text-[#4A3E4D] dark:text-[#F6D28B] hover:bg-[#F3E2AE] dark:hover:bg-[#5C4927] border border-[#F9EDC7] dark:border-[#69522B]",
    outline:
      "bg-transparent text-[#4A3E4D] dark:text-[#F8F1FF] border-2 border-[#E9DFD8] dark:border-[#40354F] hover:bg-black/5 dark:hover:bg-white/5",
    ghost: "bg-transparent text-[#4A3E4D] dark:text-[#F8F1FF] hover:bg-black/5 dark:hover:bg-white/5",
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

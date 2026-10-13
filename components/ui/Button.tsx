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
    "inline-flex items-center justify-center font-semibold transition-all duration-200 cursor-pointer select-none active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum/30";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs rounded-xl shadow-xs",
    md: "px-5 py-2.5 text-sm rounded-2xl shadow-sm",
    lg: "px-7 py-3 text-base rounded-3xl shadow-md",
  };

  const variantStyles = {
    primary:
      "bg-blush text-plum hover:bg-[#F3C5D8] border border-blush active:shadow-inner",
    secondary:
      "bg-lavender text-plum hover:bg-[#DAD1F5] border border-lavender",
    mint: "bg-mint text-plum hover:bg-[#CAE6D2] border border-mint",
    butter: "bg-butter text-plum hover:bg-[#F3E2AE] border border-butter",
    outline:
      "bg-transparent text-plum border-2 border-plum/20 hover:border-plum/40 hover:bg-black/5",
    ghost: "bg-transparent text-plum hover:bg-black/5",
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

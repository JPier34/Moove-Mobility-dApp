import React from "react";
import { cn } from "../../lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className, hover = false }) => {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-gray-100 shadow-sm",
        hover &&
          "hover:shadow-xl hover:-translate-y-2 transition-all duration-300",
        className
      )}
    >
      {children}
    </div>
  );
};

export default Card;

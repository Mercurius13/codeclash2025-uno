// components/ui/card.tsx
import React, { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export const Card = ({ children, className = "" }: CardProps) => {
  return (
    <div
      className={`bg-white dark:bg-gray-900 shadow-lg rounded-2xl p-4 border border-gray-200 dark:border-gray-700 ${className}`}
    >
      {children}
    </div>
  );
};

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export const CardContent = ({ children, className = "" }: CardContentProps) => {
  return <div className={`p-2 ${className}`}>{children}</div>;
};

"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface ClientOnlyMotionProps {
  children: React.ReactNode;
  initial?: any;
  animate?: any;
  transition?: any;
  className?: string;
  [key: string]: any;
}

export default function ClientOnlyMotion({
  children,
  initial,
  animate,
  transition,
  className,
  ...props
}: ClientOnlyMotionProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={initial}
      animate={animate}
      transition={transition}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}














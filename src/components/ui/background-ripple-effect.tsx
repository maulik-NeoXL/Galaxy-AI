"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface BackgroundRippleEffectProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  colors?: string[];
}

export const BackgroundRippleEffect = ({
  children,
  className,
  containerClassName,
  colors = ["#ff0000", "#00ff00", "#0000ff"],
}: BackgroundRippleEffectProps) => {
  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden bg-black p-10 md:p-20",
        containerClassName
      )}
    >
      <div className="pointer-events-none absolute -inset-10 h-full w-full">
        {colors.map((color, i) => (
          <motion.div
            key={i}
            className="absolute h-full w-full rounded-full opacity-20 blur-3xl"
            style={{
              background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
            }}
            animate={{
              x: [0, 100, 0],
              y: [0, 100, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              repeatType: "reverse",
              delay: i * 2,
            }}
          />
        ))}
      </div>
      <div className={cn("relative z-10", className)}>{children}</div>
    </div>
  );
};

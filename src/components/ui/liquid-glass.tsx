"use client";
import React from "react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

type LiquidGlassCardProps = React.HTMLAttributes<HTMLDivElement> & {
  children?: React.ReactNode;
  className?: string;
  square?: boolean;
  radiusClass?: string;
  singleLayer?: boolean;
};

export const LiquidGlassCard = ({
  children,
  className,
  square = false,
  radiusClass = "rounded-3xl",
  singleLayer = false,
  onMouseMove,
  ...props
}: LiquidGlassCardProps) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const { currentTarget, clientX, clientY } = event;
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
    onMouseMove?.(event);
  };

  return (
    <div
      className={cn(
        "group relative overflow-hidden border border-white/20 bg-white/[0.05] shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]",
        square
          ? "rounded-none before:rounded-none after:rounded-none"
          : `${radiusClass} before:${radiusClass} after:${radiusClass}`,
        singleLayer && "before:hidden after:hidden",
        "backdrop-blur-[40px] backdrop-saturate-[1.8]",
        "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:to-transparent before:opacity-60",
        "after:absolute after:inset-[1px] after:border after:border-white/10 after:pointer-events-none",
        className
      )}
      onMouseMove={handleMouseMove}
      {...props}
    >
      <motion.div
        className={cn(
          "pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-500 group-hover:opacity-100",
          square ? "rounded-none" : radiusClass
        )}
        style={{
          background: useMotionTemplate`
            radial-gradient(
              600px circle at ${mouseX}px ${mouseY}px,
              rgba(255, 255, 255, 0.1),
              transparent 60%
            )
          `,
        }}
      />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
};

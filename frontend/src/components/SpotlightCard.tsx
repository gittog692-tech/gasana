import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import React, { MouseEvent } from 'react';

export default function SpotlightCard({ children, className = '' }: { children: React.ReactNode, className?: string }) {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
        let { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    return (
        <div
            className={`group relative overflow-hidden ${className}`}
            onMouseMove={handleMouseMove}
        >
            {/* Soft inner glow highlight */}
            <motion.div
                className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-700 ease-in-out group-hover:opacity-100"
                style={{
                    background: useMotionTemplate`
                        radial-gradient(
                            600px circle at ${mouseX}px ${mouseY}px,
                            rgba(255, 255, 255, 0.05),
                            transparent 80%
                        )
                    `,
                }}
            />

            {/* Sharp border tracing highlight */}
            <motion.div
                className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-500 ease-in-out group-hover:opacity-100"
                style={{
                    background: useMotionTemplate`
                        radial-gradient(
                            350px circle at ${mouseX}px ${mouseY}px,
                            rgba(255, 255, 255, 0.4),
                            transparent 80%
                        )
                    `,
                    WebkitMaskImage: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                    padding: '1px',
                    borderRadius: 'inherit'
                }}
            />

            {/* Content layer */}
            <div className="relative z-10 h-full">
                {children}
            </div>
        </div>
    );
}

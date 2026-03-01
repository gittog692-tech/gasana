import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

interface FadeInProps {
    children: React.ReactNode
    direction?: 'up' | 'down' | 'left' | 'right'
    delay?: number
    duration?: number
    className?: string
    fullWidth?: boolean
}

export default function FadeIn({
    children,
    direction = 'up',
    delay = 0,
    duration = 0.5,
    className = "",
    fullWidth = false
}: FadeInProps) {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-10% 0px" })

    const directionOffset = {
        up: { y: 40, x: 0 },
        down: { y: -40, x: 0 },
        left: { x: 40, y: 0 },
        right: { x: -40, y: 0 },
    }

    return (
        <motion.div
            ref={ref}
            initial={{
                opacity: 0,
                ...directionOffset[direction]
            }}
            animate={isInView ? {
                opacity: 1,
                x: 0,
                y: 0
            } : {
                opacity: 0,
                ...directionOffset[direction]
            }}
            transition={{
                duration: duration,
                delay: delay,
                ease: [0.25, 0.25, 0, 1], // easeOutQuad-ish
            }}
            className={className}
            style={{ width: fullWidth ? '100%' : 'auto' }}
        >
            {children}
        </motion.div>
    )
}

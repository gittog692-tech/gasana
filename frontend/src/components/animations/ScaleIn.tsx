import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

interface ScaleInProps {
    children: React.ReactNode
    delay?: number
    duration?: number
    className?: string
}

export default function ScaleIn({
    children,
    delay = 0,
    duration = 0.4,
    className = ""
}: ScaleInProps) {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-50px" })

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{
                duration: duration,
                delay: delay,
                type: "spring",
                stiffness: 200,
                damping: 20
            }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

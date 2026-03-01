import { motion } from 'framer-motion'

interface StaggerContainerProps {
    children: React.ReactNode
    delayChildren?: number
    staggerChildren?: number
    className?: string
}

export default function StaggerContainer({
    children,
    delayChildren = 0,
    staggerChildren = 0.1,
    className = ""
}: StaggerContainerProps) {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
                hidden: {},
                visible: {
                    transition: {
                        delayChildren,
                        staggerChildren
                    }
                }
            }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

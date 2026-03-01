import { useEffect, useRef } from 'react';

export default function LaminarSmoke() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let time = 0;

        // Smooth mouse tracking
        let targetMouseX = 0;
        let targetMouseY = 0;
        let currentMouseX = 0;
        let currentMouseY = 0;

        const handleMouseMove = (e: MouseEvent) => {
            // Normalize cursor position between -1 and +1
            targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
            targetMouseY = (e.clientY / window.innerHeight) * 2 - 1;
        };

        const resize = () => {
            // Give it some bleed room so lines don't clip at edges
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', handleMouseMove);
        resize();

        const draw = () => {
            time += 0.0015; // Slow, elegant Apple-like speed

            // Lerp the mouse position towards the target with a slow latency
            currentMouseX += (targetMouseX - currentMouseX) * 0.025;
            currentMouseY += (targetMouseY - currentMouseY) * 0.025;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Thick, blurred ribbons of smoke
            const lines = 12;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            for (let i = 0; i < lines; i++) {
                ctx.beginPath();
                const progress = i / lines;

                // Peak opacity in the middle lines
                const op = 0.02 + Math.sin(progress * Math.PI) * 0.05;
                ctx.lineWidth = 50 + Math.sin(progress * Math.PI) * 60;

                // Sleek grey/white/teal mix
                ctx.strokeStyle = `rgba(180, 220, 240, ${op})`;

                // The mouse offsets the horizontal waves and vertical centers differently for a 3D feel
                const xOffset = currentMouseX * canvas.width * 0.15 * progress;
                const yOffset = currentMouseY * canvas.height * 0.15;

                for (let x = -100; x < canvas.width + 100; x += 40) {
                    // Smooth laminar flow wave equation with mouse influence
                    const y = (canvas.height * 0.5)
                        + Math.sin((x + xOffset) * 0.0012 + time + progress * 2) * (canvas.height * 0.35)
                        + Math.cos((x - xOffset) * 0.0008 - time * 1.1 + progress * 4) * (canvas.height * 0.25)
                        + (progress - 0.5) * canvas.height * 0.5
                        + (yOffset * Math.sin(progress * Math.PI)); // Mouse Y influence

                    if (x === -100) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
            }

            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    // We blur it heavily and mix-blend to make it feel like 3D volumetric smoke
    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 z-0 pointer-events-none opacity-80 mix-blend-screen"
            style={{ filter: 'blur(35px)' }}
        />
    );
}

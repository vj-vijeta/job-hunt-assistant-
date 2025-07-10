import React, { useEffect, useRef } from 'react';

const BackgroundAnimation = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let particlesArray: Particle[] = [];
        let animationFrameId: number;
        
        const setCanvasSize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        setCanvasSize();

        class Particle {
            x: number;
            y: number;
            directionX: number;
            directionY: number;
            size: number;
            color: string;
            
            constructor(x: number, y: number, directionX: number, directionY: number, size: number, color: string) {
                this.x = x;
                this.y = y;
                this.directionX = directionX;
                this.directionY = directionY;
                this.size = size;
                this.color = color;
            }

            draw() {
                if (!ctx) return;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
                ctx.fillStyle = this.color;
                ctx.fill();
            }

            update() {
                if (this.x > canvas.width || this.x < 0) {
                    this.directionX = -this.directionX;
                }
                if (this.y > canvas.height || this.y < 0) {
                    this.directionY = -this.directionY;
                }
                this.x += this.directionX;
                this.y += this.directionY;
                this.draw();
            }
        }

        const init = () => {
            particlesArray = [];
            const isDark = document.documentElement.classList.contains('dark');
            const particleColor = isDark ? 'rgba(147, 197, 253, 0.2)' : 'rgba(10, 35, 66, 0.2)';
            const numberOfParticles = (canvas.height * canvas.width) / 9000;
            for (let i = 0; i < numberOfParticles; i++) {
                const size = Math.random() * 2 + 1;
                const x = Math.random() * (window.innerWidth - size * 2) + size;
                const y = Math.random() * (window.innerHeight - size * 2) + size;
                const directionX = (Math.random() - 0.5) * 0.2;
                const directionY = (Math.random() - 0.5) * 0.2;
                particlesArray.push(new Particle(x, y, directionX, directionY, size, particleColor));
            }
        };
        
        const connect = () => {
            if (!ctx) return;
            let opacityValue = 1;
            const connectDistance = (window.innerWidth / 8) * (window.innerHeight / 8);

            for (let a = 0; a < particlesArray.length; a++) {
                for (let b = a; b < particlesArray.length; b++) {
                    const distance = ((particlesArray[a].x - particlesArray[b].x) * (particlesArray[a].x - particlesArray[b].x)) +
                                   ((particlesArray[a].y - particlesArray[b].y) * (particlesArray[a].y - particlesArray[b].y));
                    
                    if (distance < connectDistance) {
                        opacityValue = 1 - (distance / connectDistance);
                        const isDark = document.documentElement.classList.contains('dark');
                        const lineColor = isDark ? `rgba(147, 197, 253, ${opacityValue * 0.3})` : `rgba(10, 35, 66, ${opacityValue * 0.3})`;
                        
                        ctx.strokeStyle = lineColor;
                        ctx.lineWidth = 1; 
                        ctx.beginPath();
                        ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                        ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                        ctx.stroke();
                    }
                }
            }
        };

        const animate = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
            for (let i = 0; i < particlesArray.length; i++) {
                particlesArray[i].update();
            }
            connect(); // Connect particles
            animationFrameId = requestAnimationFrame(animate);
        };
        
        init();
        animate();

        const handleResize = () => {
            cancelAnimationFrame(animationFrameId);
            setCanvasSize();
            init();
            animate();
        };

        window.addEventListener('resize', handleResize);
        
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    handleResize();
                }
            });
        });

        observer.observe(document.documentElement, { attributes: true });


        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
            observer.disconnect();
        };
    }, []);

    return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full z-[-1]" />;
};

export default BackgroundAnimation;

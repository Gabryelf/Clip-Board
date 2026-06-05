// Canvas Renderer Module
(function() {
    window.CanvasRenderer = {
        canvas: null,
        ctx: null,
        
        // Images
        bgImage: null,
        midImage: null,
        frontImage: null,
        
        // Settings
        midSize: 40,
        frontSize: 60,
        midAnim: 'slide',
        frontAnim: 'slide',
        speed: 1.0,
        
        // Animation state
        animationActive: false,
        animationFrameId: null,
        startTime: null,
        currentTime: 0,
        
        init(canvasElement) {
            this.canvas = canvasElement;
            this.ctx = canvasElement.getContext('2d');
            this.canvas.width = 1280;
            this.canvas.height = 720;
            this.renderFrame(0);
        },
        
        applyAnimation(img, time, type, sizePercent, offsetX = 0, offsetY = 0) {
            if (!img) return;
            
            const w = img.width;
            const h = img.height;
            const scale = sizePercent / 100;
            let drawW = w * 0.4 * scale;
            let drawH = h * 0.4 * scale;
            
            let baseX = (this.canvas.width - drawW) / 2 + offsetX;
            let baseY = (this.canvas.height - drawH) / 2 + offsetY;
            
            const t = time * this.speed;
            let x = baseX, y = baseY;
            let angle = 0;
            let scaleX = 1, scaleY = 1;
            
            switch(type) {
                case 'slide':
                    x = baseX + Math.sin(t * 1.5) * 120;
                    y = baseY + Math.cos(t * 1.2) * 40;
                    break;
                case 'rotate':
                    angle = t * 1.2;
                    break;
                case 'bounce':
                    y = baseY - Math.abs(Math.sin(t * 3)) * 50;
                    break;
                case 'zoom':
                    const zoomFactor = 0.7 + Math.sin(t * 4) * 0.3;
                    scaleX = zoomFactor;
                    scaleY = zoomFactor;
                    break;
                case 'float':
                    y = baseY + Math.sin(t * 1.8) * 25;
                    x = baseX + Math.sin(t * 1.2) * 15;
                    break;
                case 'shake':
                    x = baseX + Math.sin(t * 30) * 5;
                    y = baseY + Math.cos(t * 31) * 4;
                    break;
                default:
                    x = baseX;
                    y = baseY;
            }
            
            this.ctx.save();
            this.ctx.translate(x + drawW/2, y + drawH/2);
            if (angle) this.ctx.rotate(angle);
            this.ctx.scale(scaleX, scaleY);
            this.ctx.drawImage(img, -drawW/2, -drawH/2, drawW, drawH);
            this.ctx.restore();
        },
        
        renderFrame(seconds) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Background
            if (this.bgImage) {
                this.ctx.drawImage(this.bgImage, 0, 0, this.canvas.width, this.canvas.height);
            } else {
                const grad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
                grad.addColorStop(0, '#1a1a2e');
                grad.addColorStop(1, '#16213e');
                this.ctx.fillStyle = grad;
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }
            
            // Middle layer
            if (this.midImage) {
                this.applyAnimation(this.midImage, seconds, this.midAnim, this.midSize, 0, -20);
            }
            
            // Front layer
            if (this.frontImage) {
                this.applyAnimation(this.frontImage, seconds, this.frontAnim, this.frontSize, 0, 30);
            }
            
            // Subtle vignette
            const grad = this.ctx.createRadialGradient(
                this.canvas.width/2, this.canvas.height/2, 300,
                this.canvas.width/2, this.canvas.height/2, this.canvas.width/1.5
            );
            grad.addColorStop(0, 'rgba(0,0,0,0)');
            grad.addColorStop(1, 'rgba(0,0,0,0.4)');
            this.ctx.fillStyle = grad;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        },
        
        startAnimation() {
            if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
            this.startTime = performance.now() / 1000 - this.currentTime;
            this.animationActive = true;
            
            const animate = (nowMs) => {
                if (!this.animationActive) return;
                const nowSec = nowMs / 1000;
                this.currentTime = nowSec - this.startTime;
                this.renderFrame(this.currentTime);
                this.animationFrameId = requestAnimationFrame(animate);
            };
            this.animationFrameId = requestAnimationFrame(animate);
        },
        
        stopAnimation() {
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
            this.animationActive = false;
            this.renderFrame(this.currentTime);
        },
        
        updateLayerInfo() {
            const info = document.getElementById('layerInfo');
            if (info) {
                info.innerHTML = `Фон: ${this.bgImage ? '✓' : '—'} | Средний: ${this.midImage ? '✓' : '—'} | Ближний: ${this.frontImage ? '✓' : '—'}`;
            }
        }
    };
})();
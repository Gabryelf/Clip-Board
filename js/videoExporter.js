// Video Exporter Module
(function() {
    window.VideoExporter = {
        async captureFrames(renderer, duration, fps = 24) {
            const frames = [];
            const totalFrames = Math.floor(duration * fps);
            
            for (let i = 0; i <= totalFrames; i++) {
                const t = i / fps;
                renderer.renderFrame(t);
                const blob = await new Promise(resolve => renderer.canvas.toBlob(resolve, 'image/jpeg', 0.9));
                frames.push(blob);
                
                // Update progress
                const progressEl = document.getElementById('exportProgress');
                if (progressEl) {
                    progressEl.textContent = `Запись кадров: ${Math.round(i / totalFrames * 100)}%`;
                    progressEl.className = 'progress-visible';
                }
            }
            return frames;
        },
        
        async exportAsWebM(renderer, duration, audioBuffer = null) {
            const progressEl = document.getElementById('exportProgress');
            progressEl.className = 'progress-visible';
            progressEl.textContent = 'Подготовка...';
            
            const fps = 30;
            const stream = renderer.canvas.captureStream(fps);
            const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
            const chunks = [];
            
            let startTime = performance.now();
            let frameInterval = 1000 / fps;
            let frameCount = 0;
            const totalFrames = Math.floor(duration * fps);
            
            recorder.ondataavailable = (e) => chunks.push(e.data);
            
            return new Promise((resolve, reject) => {
                recorder.onstop = () => {
                    const blob = new Blob(chunks, { type: 'video/webm' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `clip_${Date.now()}.webm`;
                    a.click();
                    URL.revokeObjectURL(url);
                    progressEl.className = 'progress-hidden';
                    resolve();
                };
                
                recorder.start(100);
                
                const animateRecording = () => {
                    if (frameCount > totalFrames) {
                        recorder.stop();
                        return;
                    }
                    
                    const t = frameCount / fps;
                    renderer.renderFrame(t);
                    progressEl.textContent = `🎬 Экспорт WebM: ${Math.round(frameCount / totalFrames * 100)}%`;
                    
                    frameCount++;
                    setTimeout(animateRecording, frameInterval);
                };
                
                animateRecording();
            });
        },
        
        async exportAsGIF(renderer, duration) {
            const progressEl = document.getElementById('exportProgress');
            progressEl.className = 'progress-visible';
            progressEl.textContent = 'Создание GIF...';
            
            const fps = 12;
            const frames = await this.captureFrames(renderer, duration, fps);
            
            // Using gif.js for better quality (load dynamically)
            if (typeof GIF === 'undefined') {
                await this.loadGifLibrary();
            }
            
            const gif = new GIF({
                workers: 2,
                quality: 10,
                width: renderer.canvas.width,
                height: renderer.canvas.height,
                workerScript: 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js'
            });
            
            return new Promise((resolve, reject) => {
                for (let i = 0; i < frames.length; i++) {
                    const img = new Image();
                    const url = URL.createObjectURL(frames[i]);
                    img.onload = () => {
                        gif.addFrame(img, { delay: 1000 / fps });
                        URL.revokeObjectURL(url);
                    };
                    img.src = url;
                }
                
                gif.on('finished', (blob) => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `clip_${Date.now()}.gif`;
                    a.click();
                    URL.revokeObjectURL(url);
                    progressEl.className = 'progress-hidden';
                    resolve();
                });
                
                gif.on('progress', (p) => {
                    progressEl.textContent = `🎞️ Создание GIF: ${Math.round(p * 100)}%`;
                });
                
                gif.render();
            });
        },
        
        loadGifLibrary() {
            return new Promise((resolve, reject) => {
                if (typeof GIF !== 'undefined') {
                    resolve();
                    return;
                }
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.js';
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }
    };
})();
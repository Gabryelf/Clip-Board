// Main Application
(function() {
    // DOM Elements
    const canvas = document.getElementById('clipCanvas');
    const bgUpload = document.getElementById('bgUpload');
    const midUpload = document.getElementById('midUpload');
    const frontUpload = document.getElementById('frontUpload');
    const clearBg = document.getElementById('clearBg');
    const previewBtn = document.getElementById('previewBtn');
    const stopAnimBtn = document.getElementById('stopAnimBtn');
    const exportWebmBtn = document.getElementById('exportWebmBtn');
    const exportGifBtn = document.getElementById('exportGifBtn');
    const midSize = document.getElementById('midSize');
    const frontSize = document.getElementById('frontSize');
    const midAnimType = document.getElementById('midAnimType');
    const frontAnimType = document.getElementById('frontAnimType');
    const speedSlider = document.getElementById('speedSlider');
    const speedVal = document.getElementById('speedVal');
    const midSizeVal = document.getElementById('midSizeVal');
    const frontSizeVal = document.getElementById('frontSizeVal');
    const musicUpload = document.getElementById('musicUpload');
    const audioStatus = document.getElementById('audioStatus');
    const canvasOverlay = document.getElementById('canvasOverlay');
    
    // Audio
    let audioContext = null;
    let audioBuffer = null;
    let audioSource = null;
    let audioDuration = 0;
    
    // Initialize Renderer
    CanvasRenderer.init(canvas);
    
    // Helper: load image from file
    function loadImage(file, callback) {
        if (!file) {
            callback(null);
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => callback(img);
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    // Upload handlers
    document.getElementById('bgUploadArea').addEventListener('click', () => bgUpload.click());
    document.getElementById('midUploadArea').addEventListener('click', () => midUpload.click());
    document.getElementById('frontUploadArea').addEventListener('click', () => frontUpload.click());
    document.getElementById('musicUploadArea').addEventListener('click', () => musicUpload.click());
    
    bgUpload.addEventListener('change', (e) => {
        loadImage(e.target.files[0], (img) => {
            CanvasRenderer.bgImage = img;
            CanvasRenderer.updateLayerInfo();
            CanvasRenderer.renderFrame(CanvasRenderer.currentTime);
            canvasOverlay.classList.add('hidden');
        });
    });
    
    midUpload.addEventListener('change', (e) => {
        loadImage(e.target.files[0], (img) => {
            CanvasRenderer.midImage = img;
            CanvasRenderer.updateLayerInfo();
            CanvasRenderer.renderFrame(CanvasRenderer.currentTime);
            canvasOverlay.classList.add('hidden');
        });
    });
    
    frontUpload.addEventListener('change', (e) => {
        loadImage(e.target.files[0], (img) => {
            CanvasRenderer.frontImage = img;
            CanvasRenderer.updateLayerInfo();
            CanvasRenderer.renderFrame(CanvasRenderer.currentTime);
            canvasOverlay.classList.add('hidden');
        });
    });
    
    clearBg.addEventListener('click', () => {
        CanvasRenderer.bgImage = null;
        CanvasRenderer.updateLayerInfo();
        CanvasRenderer.renderFrame(CanvasRenderer.currentTime);
    });
    
    // Size controls
    midSize.addEventListener('input', (e) => {
        CanvasRenderer.midSize = parseInt(e.target.value);
        midSizeVal.textContent = CanvasRenderer.midSize;
        CanvasRenderer.renderFrame(CanvasRenderer.currentTime);
    });
    
    frontSize.addEventListener('input', (e) => {
        CanvasRenderer.frontSize = parseInt(e.target.value);
        frontSizeVal.textContent = CanvasRenderer.frontSize;
        CanvasRenderer.renderFrame(CanvasRenderer.currentTime);
    });
    
    // Animation type
    midAnimType.addEventListener('change', (e) => {
        CanvasRenderer.midAnim = e.target.value;
    });
    
    frontAnimType.addEventListener('change', (e) => {
        CanvasRenderer.frontAnim = e.target.value;
    });
    
    // Speed
    speedSlider.addEventListener('input', (e) => {
        CanvasRenderer.speed = parseFloat(e.target.value);
        speedVal.textContent = CanvasRenderer.speed.toFixed(2);
    });
    
    // Preview controls
    previewBtn.addEventListener('click', () => {
        if (CanvasRenderer.animationActive) {
            CanvasRenderer.stopAnimation();
        }
        CanvasRenderer.startAnimation();
        canvasOverlay.classList.add('hidden');
    });
    
    stopAnimBtn.addEventListener('click', () => {
        CanvasRenderer.stopAnimation();
    });
    
    // Audio handling
    async function playMusic(file) {
        stopMusic();
        if (!file) return;
        
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        try {
            const arrayBuffer = await file.arrayBuffer();
            audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            audioDuration = audioBuffer.duration;
            
            audioSource = audioContext.createBufferSource();
            audioSource.buffer = audioBuffer;
            audioSource.connect(audioContext.destination);
            audioSource.loop = true;
            audioSource.start();
            
            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }
            
            audioStatus.textContent = `🎵 Играет: ${file.name.substring(0, 30)}`;
            audioStatus.style.color = '#2ecc71';
        } catch (e) {
            console.warn('Audio error:', e);
            audioStatus.textContent = '❌ Ошибка загрузки аудио';
        }
    }
    
    function stopMusic() {
        if (audioSource) {
            try { audioSource.stop(); } catch(e) {}
            audioSource = null;
        }
        audioStatus.textContent = 'Нет аудио';
        audioStatus.style.color = '#ffcf9a';
    }
    
    musicUpload.addEventListener('change', (e) => {
        if (e.target.files[0]) {
            playMusic(e.target.files[0]);
        } else {
            stopMusic();
        }
    });
    
    // Export functions
    function getVideoDuration() {
        if (audioBuffer && audioBuffer.duration) {
            return Math.min(audioBuffer.duration, 15);
        }
        return 6;
    }
    
    exportWebmBtn.addEventListener('click', async () => {
        if (CanvasRenderer.animationActive) {
            CanvasRenderer.stopAnimation();
        }
        
        const duration = getVideoDuration();
        await VideoExporter.exportAsWebM(CanvasRenderer, duration, audioBuffer);
        
        if (audioSource && audioContext) {
            try { audioSource.start(0); } catch(e) {}
        }
    });
    
    exportGifBtn.addEventListener('click', async () => {
        if (CanvasRenderer.animationActive) {
            CanvasRenderer.stopAnimation();
        }
        
        const duration = Math.min(getVideoDuration(), 8);
        await VideoExporter.exportAsGIF(CanvasRenderer, duration);
    });
    
    // Initial render
    CanvasRenderer.renderFrame(0);
    CanvasRenderer.updateLayerInfo();
    
    // Show overlay if no images
    if (!CanvasRenderer.bgImage && !CanvasRenderer.midImage && !CanvasRenderer.frontImage) {
        canvasOverlay.classList.remove('hidden');
    }
})();
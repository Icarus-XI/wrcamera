// Variable Mapping Registry 
const takePictureBtn = document.getElementById('take-picture-btn'); 
const redoButton = document.getElementById('redo-button'); 
const uploadButton = document.getElementById('upload-button'); 
const cameraFeed = document.getElementById('camera-feed'); 
const takenImage = document.getElementById('taken-image'); 
const proNumberInput = document.getElementById('pro-number'); 
const lengthInput = document.getElementById('length'); 
const widthInput = document.getElementById('width'); 
const heightInput = document.getElementById('height'); 
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const torchContainer = document.getElementById('torch-container');

let capturedDataUrl = ""; 
let html5QrcodeScanner = null; 
let isScanningPaused = false; 
let isTorchOn = false;

// Structural Validation Check Framework 
function validateForm() { 
    const hasImage = capturedDataUrl !== ""; 
    const isProValid = proNumberInput.checkValidity() && proNumberInput.value.trim() !== ""; 
    const isLengthValid = lengthInput.value !== ""; 
    const isWidthValid = widthInput.value !== ""; 
    const isHeightValid = heightInput.value !== ""; 
    
    uploadButton.disabled = !(hasImage && isProValid && isLengthValid && isWidthValid && isHeightValid); 
} 

[proNumberInput, lengthInput, widthInput, heightInput].forEach(input => { 
    input.addEventListener('input', validateForm); 
}); 

// Flashlight/Torch Controller Injector
function setupTorchControl(localScannerInstance) {
    torchContainer.innerHTML = ""; 
    
    // Check if the current browser track gives us hardware control capabilities
    setTimeout(() => {
        try {
            const videoTrack = cameraFeed.querySelector('video')?.srcObject?.getVideoTracks()[0];
            const capabilities = videoTrack?.getCapabilities();
            
            if (capabilities && 'torch' in capabilities) {
                const torchBtn = document.createElement('button');
                torchBtn.id = "torch-toggle-btn";
                torchBtn.textContent = "🔦 Turn Flashlight ON";
                
                torchBtn.addEventListener('click', async () => {
                    isTorchOn = !isTorchOn;
                    await videoTrack.applyConstraints({
                        advanced: [{ torch: isTorchOn }]
                    });
                    torchBtn.textContent = isTorchOn ? "🔦 Turn Flashlight OFF" : "🔦 Turn Flashlight ON";
                });
                
                torchContainer.appendChild(torchBtn);
            }
        } catch (e) {
            console.log("Torch access profile or permissions restriction:", e);
        }
    }, 1000); // Small brief delay to let stream mount completely before checking hardware properties
}

// Auto-Scan Routine Mapping 
function startQrScanner() { 
    cameraFeed.innerHTML = ""; 
    isScanningPaused = false; 
    isTorchOn = false;
    torchContainer.innerHTML = "";
    
    const innerFeed = document.createElement("div"); 
    innerFeed.id = "qr-inner-video"; 
    innerFeed.style.width = "100%"; 
    innerFeed.style.height = "100%"; 
    cameraFeed.appendChild(innerFeed); 
    
    html5QrcodeScanner = new Html5Qrcode("qr-inner-video"); 
    html5QrcodeScanner.start( 
        { facingMode: { exact: "environment" } }, 
        { fps: 10, qrbox: 250, videoConstraints: { facingMode: { exact: "environment" } } }, 
        (decodedText) => { 
            if (isScanningPaused) return; 
            console.log("Raw Scanned Payload: " + decodedText); 
            
            const cleanedNumbers = decodedText.replace(/\D/g, ''); 
            
            // Layout parser: targets long combined labels (usually 15 digits)
            if (cleanedNumbers.length >= 15) { 
                isScanningPaused = true; 
                
                // Haptic Feedback Engine: Triggers a clean physical phone vibrate
                if (navigator.vibrate) { navigator.vibrate(150); }
                
                // Skips the first 4 HUID prefix numbers, grabs the core 9 digits
                const targetProNumber = cleanedNumbers.substring(4, 13); 
                proNumberInput.value = targetProNumber; 
                
                const currentVideoElement = cameraFeed.querySelector('video'); 
                if (currentVideoElement) { 
                    currentVideoElement.setAttribute('data-scan-locked', 'true'); 
                } 
                torchContainer.innerHTML = ""; // Drop flashlight button on lock
                validateForm(); 
            } 
            // Fallback layout parser: targets pure 9-digit standard Pro labels
            else if (cleanedNumbers.length === 9) {
                isScanningPaused = true; 
                
                if (navigator.vibrate) { navigator.vibrate(150); }
                
                proNumberInput.value = cleanedNumbers; 
                
                const currentVideoElement = cameraFeed.querySelector('video'); 
                if (currentVideoElement) { 
                    currentVideoElement.setAttribute('data-scan-locked', 'true'); 
                } 
                torchContainer.innerHTML = "";
                validateForm(); 
            }
        }, 
        (errorMessage) => { 
            // Loops video frames smoothly until a code enters bounds 
        } 
    ).then(() => { 
        const iosVideoElement = cameraFeed.querySelector('video'); 
        if (iosVideoElement) { 
            iosVideoElement.setAttribute('playsinline', 'true'); 
            iosVideoElement.setAttribute('webkit-playsinline', 'true'); 
            iosVideoElement.muted = true; 
            iosVideoElement.play(); 
            iosVideoElement.style.transform = 'scaleX(1)'; 
        } 
        setupTorchControl(html5QrcodeScanner);
    }).catch(err => { 
        console.error("Strict environment lock failed, attempting generic back lens fallback...", err); 
        html5QrcodeScanner.start( 
            { facingMode: "environment" }, 
            { fps: 10, qrbox: 250 } 
        ).then(() => { 
            const iosVideoElement = cameraFeed.querySelector('video'); 
            if (iosVideoElement) { 
                iosVideoElement.setAttribute('playsinline', 'true'); 
                iosVideoElement.setAttribute('webkit-playsinline', 'true'); 
                iosVideoElement.muted = true; 
                iosVideoElement.play(); 
                iosVideoElement.style.transform = 'scaleX(1)'; 
            } 
            setupTorchControl(html5QrcodeScanner);
        }).catch(finalErr => { 
            console.error("All camera pipelines failed:", finalErr); 
        }); 
    }); 
} 

// Direct Auto-Initialization Loop Engine
document.addEventListener("DOMContentLoaded", () => { 
    // Feature 1: Automatic Camera Trigger on boot layout sequence
    startQrScanner();

    const startBtn = document.getElementById('start-stream-btn'); 
    if (startBtn) { 
        startBtn.addEventListener('click', startQrScanner); 
    } 
    
    // Feature 3: Local Dark Mode Switch Toggle Manager
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            if (currentTheme === 'dark') {
                document.documentElement.removeAttribute('data-theme');
                themeToggleBtn.textContent = "🌙 Dark Mode";
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                themeToggleBtn.textContent = "☀️ Light Mode";
            }
        });
    }
}); 

// Canvas Freeze Frame Drawing Engine with Immediate File Generation 
takePictureBtn.addEventListener('click', async () => { 
    const canvas = document.createElement('canvas'); 
    const activeVideoTrack = cameraFeed.querySelector('video') || cameraFeed; 
    
    canvas.width = activeVideoTrack.videoWidth || 640; 
    canvas.height = activeVideoTrack.videoHeight || 480; 
    
    const context = canvas.getContext('2d'); 
    context.drawImage(activeVideoTrack, 0, 0); 
    
    const proNumber = proNumberInput.value || 'N/A'; 
    const length = lengthInput.value || '0'; 
    const width = widthInput.value || '0'; 
    const height = heightInput.value || '0'; 
    const timestamp = new Date().toLocaleString(); 
    
    context.font = 'bold 20px Arial'; 
    context.textBaseline = 'top'; 
    
    const lines = [ 
        `PRO: ${proNumber}`, 
        `DIM: ${length}" x ${width}" x ${height}"`, 
        `DATE: ${timestamp}` 
    ]; 
    
    const boxWidth = 320; 
    const boxHeight = (lines.length * 26) + 16; 
    const margin = 12; 
    const x = canvas.width - boxWidth - margin; 
    const y = margin; 
    
    context.fillStyle = 'rgba(0, 0, 0, 0.65)'; 
    context.fillRect(x, y, boxWidth, boxHeight); 
    context.fillStyle = '#ffffff'; 
    
    lines.forEach((line, index) => { 
        const textY = y + 10 + (index * 26); 
        context.fillText(line, x + 12, textY); 
    }); 
    
    capturedDataUrl = canvas.toDataURL('image/jpeg', 0.85); 
    takenImage.src = capturedDataUrl; 
    cameraFeed.insertAdjacentElement('beforebegin', takenImage); 
    cameraFeed.style.display = 'none'; 
    
    torchContainer.innerHTML = ""; // Clear flashlight on freeze frame
    
    if (html5QrcodeScanner && html5QrcodeScanner.isScanning) { 
        html5QrcodeScanner.stop().catch(err => console.log("Scanner stop background error:", err)); 
    } 
    validateForm(); 
}); 

// Redo button reset sequence
redoButton.addEventListener('click', async () => { 
    if (html5QrcodeScanner) { 
        try { 
            if (html5QrcodeScanner.isScanning) { 
                await html5QrcodeScanner.stop(); 
            } 
        } catch(e) { 
            console.log("Scanner hardware lifecycle clear bypass."); 
        } 
        html5QrcodeScanner = null; 
    } 
    

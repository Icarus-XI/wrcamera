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
            const videoTrack = cameraFeed.querySelector('video')?.srcObject?.getVideoTracks();
            const capabilities = videoTrack?.getCapabilities();
            
            if (capabilities && 'torch' in capabilities) {
                const torchBtn = document.createElement('button');
                torchBtn.id = "torch-toggle-btn";
                torchBtn.textContent = "🔋 Turn Flashlight ON";
                
                torchBtn.addEventListener('click', async () => {
                    isTorchOn = !isTorchOn;
                    await videoTrack.applyConstraints({
                        advanced: [{ torch: isTorchOn }]
                    });
                    torchBtn.textContent = isTorchOn ? "🔋 Turn Flashlight OFF" : "🔋 Turn Flashlight ON";
                });
                
                torchContainer.appendChild(torchBtn);
            }
        } catch (e) {
            console.log("Torch access profile or permissions restriction:", e);
        }
    }, 1000); 
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
            
            if (cleanedNumbers.length >= 15) { 
                isScanningPaused = true; 
                if (navigator.vibrate) { navigator.vibrate(150); }
                const targetProNumber = cleanedNumbers.substring(4, 13); 
                proNumberInput.value = targetProNumber; 
                const currentVideoElement = cameraFeed.querySelector('video'); 
                if (currentVideoElement) { 
                    currentVideoElement.setAttribute('data-scan-locked', 'true'); 
                } 
                torchContainer.innerHTML = ""; 
                validateForm(); 
            } 
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
        (errorMessage) => {} 
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
        console.error("Strict lock failed, switching fallback lens...", err); 
        html5QrcodeScanner.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }).then(() => { 
            const iosVideoElement = cameraFeed.querySelector('video'); 
            if (iosVideoElement) { 
                iosVideoElement.setAttribute('playsinline', 'true'); 
                iosVideoElement.setAttribute('webkit-playsinline', 'true'); 
                iosVideoElement.muted = true; 
                iosVideoElement.play(); 
                iosVideoElement.style.transform = 'scaleX(1)'; 
            } 
            setupTorchControl(html5QrcodeScanner);
        }).catch(finalErr => { console.error("Camera failed:", finalErr); }); 
    }); 
}
// Direct Auto-Initialization Loop Engine
document.addEventListener("DOMContentLoaded", () => { 
    startQrScanner();

    const startBtn = document.getElementById('start-stream-btn'); 
    if (startBtn) { 
        startBtn.addEventListener('click', startQrScanner); 
    } 
    
    // Theme Memory Engine: Check if the user previously selected Dark Mode
    const savedTheme = localStorage.getItem('wr-camera-theme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        if (themeToggleBtn) themeToggleBtn.textContent = "☀️ Light Mode";
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            if (currentTheme === 'dark') {
                document.documentElement.removeAttribute('data-theme');
                themeToggleBtn.textContent = "🌙 Dark Mode";
                localStorage.setItem('wr-camera-theme', 'light'); 
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                themeToggleBtn.textContent = "☀️ Light Mode";
                localStorage.setItem('wr-camera-theme', 'dark'); 
            }
        });
    }
}); 

// Canvas Freeze Frame Drawing Engine with Immediate File Generation 
takePictureBtn.addEventListener('click', async () => { 
    const canvas = document.createElement('canvas'); 
    const activeVideoTrack = cameraFeed.querySelector('video') || cameraFeed; 
    
    // QUALITY UPGRADE: Target full High-Definition (HD) scale if system properties hide raw streams
    canvas.width = activeVideoTrack.videoWidth || 1920; 
    canvas.height = activeVideoTrack.videoHeight || 1080; 
    
    const context = canvas.getContext('2d'); 
    context.drawImage(activeVideoTrack, 0, 0); 
    
    const proNumber = proNumberInput.value || 'N/A'; 
    const length = lengthInput.value || '0'; 
    const width = widthInput.value || '0'; 
    const height = heightInput.value || '0'; 
    const timestamp = new Date().toLocaleString(); 
    
    // Set font style early so the canvas engine can accurately measure text pixel widths
    context.font = 'bold 36px Arial'; 
    context.textBaseline = 'top'; 
    
    // DIRECTION FIX: Explicitly tell canvas engine to treat text alignment coordinates from the right edge
    context.textAlign = 'right';
    
    const lines = [ 
        `PRO: ${proNumber}`, 
        `DIM: ${length}" x ${width}" x ${height}"`, 
        `DATE: ${timestamp}` 
    ]; 
    
    // DYNAMIC BOX SIZING: Measure each line and find the longest one automatically
    let maxTextWidth = 0;
    lines.forEach(line => {
        const textWidth = context.measureText(line).width;
        if (textWidth > maxTextWidth) {
            maxTextWidth = textWidth;
        }
    });
    
    // Calculate final box dimensions using the text size + custom padding
    const boxWidth = maxTextWidth + 40; 
    const boxHeight = (lines.length * 44) + 24; 
    const margin = 24; 
    
    // POSITIONING CALCULATOR: Lock layout securely to the top-right corner frame boundary
    const x = canvas.width - margin; 
    const y = margin; 
    
    // Draw the background black box (needs to draw from left boundary point of its width calculation)
    context.fillStyle = 'rgba(0, 0, 0, 0.65)'; 
    context.fillRect(x - boxWidth, y, boxWidth, boxHeight); 
    
    // Print lines using right alignment spacing anchors
    context.fillStyle = '#ffffff'; 
    lines.forEach((line, index) => { 
        const textY = y + 16 + (index * 44); 
        context.fillText(line, x - 20, textY); 
    }); 
    
    // QUALITY UPGRADE: Changed JPEG compression from 0.85 to 0.98 for maximum pixel clarity
    capturedDataUrl = canvas.toDataURL('image/jpeg', 0.98); 
    takenImage.src = capturedDataUrl; 
    cameraFeed.insertAdjacentElement('beforebegin', takenImage); 
    cameraFeed.style.display = 'none'; 
    
    torchContainer.innerHTML = ""; 
    
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
            console.log("Scanner lifecycle clear bypass."); 
        } 
        html5QrcodeScanner = null; 
    } 
    
    document.body.appendChild(takenImage); 
    cameraFeed.style.display = 'flex'; 
    cameraFeed.innerHTML = '<button id="start-stream-btn" style="width: 80%; background-color: #3498db; color: #fff; height: 44px; font-size: 16px; font-weight: bold; border: none; border-radius: 4px; cursor: pointer;">Activate Warehouse Camera</button>'; 
    
    startQrScanner();
    
    proNumberInput.value = ""; 
    lengthInput.value = ""; 
    widthInput.value = ""; 
    heightInput.value = ""; 
    capturedDataUrl = ""; 
    takenImage.src = ''; 
    isScanningPaused = false; 
    
    validateForm(); 
}); 

// Native iOS Share Sheet Menu Trigger
uploadButton.addEventListener('click', async () => { 
    uploadButton.disabled = true; 
    uploadButton.textContent = "Opening Save Menu..."; 
    const fileName = `PRO_${proNumberInput.value}_DIM_${lengthInput.value}x${widthInput.value}x${heightInput.value}.jpg`; 
    
    try { 
        const response = await fetch(capturedDataUrl); 
        const blob = await response.blob(); 
        const finalFile = new File([blob], fileName, { type: "image/jpeg" }); 
        
        if (navigator.canShare && navigator.canShare({ files: [finalFile] })) { 
            await navigator.share({ files: [finalFile], title: 'Stamped Entry' }); 
            proNumberInput.value = ""; 
            lengthInput.value = ""; 
            widthInput.value = ""; 
            heightInput.value = ""; 
            redoButton.click(); 
        } else { 
            throw new Error("Sharing profiles unavailable."); 
        } 
    } catch (error) { 
        console.error('File export crash:', error); 
        const downloadLink = document.createElement('a'); 
        downloadLink.href = capturedDataUrl; 
        downloadLink.download = fileName; 
        document.body.appendChild(downloadLink); 
        downloadLink.click(); 
        document.body.removeChild(downloadLink); 
        
        proNumberInput.value = ""; 
        lengthInput.value = ""; 
        widthInput.value = ""; 
        heightInput.value = ""; 
        redoButton.click(); 
    } finally { 
        uploadButton.textContent = "Save Image to Device"; 
    } 
});

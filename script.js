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

let capturedDataUrl = ""; 
let html5QrcodeScanner = null; 
let isScanningPaused = false; 

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

// Auto-Scan Routine Mapping 
function startQrScanner() { 
    cameraFeed.innerHTML = ""; 
    isScanningPaused = false; 
    
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
                
                // Skips the first 4 HUID prefix numbers, grabs the core 9 digits
                const targetProNumber = cleanedNumbers.substring(4, 13); 
                proNumberInput.value = targetProNumber; 
                
                const currentVideoElement = cameraFeed.querySelector('video'); 
                if (currentVideoElement) { 
                    currentVideoElement.setAttribute('data-scan-locked', 'true'); 
                } 
                validateForm(); 
            } 
            // Fallback layout parser: targets pure 9-digit standard Pro labels
            else if (cleanedNumbers.length === 9) {
                isScanningPaused = true; 
                proNumberInput.value = cleanedNumbers; 
                
                const currentVideoElement = cameraFeed.querySelector('video'); 
                if (currentVideoElement) { 
                    currentVideoElement.setAttribute('data-scan-locked', 'true'); 
                } 
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
        }).catch(finalErr => { 
            console.error("All camera pipelines failed:", finalErr); 
        }); 
    }); 
} 

// Binds the camera launch to a safe user interaction block 
document.addEventListener("DOMContentLoaded", () => { 
    const startBtn = document.getElementById('start-stream-btn'); 
    if (startBtn) { 
        startBtn.addEventListener('click', startQrScanner); 
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
    
    document.body.appendChild(takenImage); 
    cameraFeed.style.display = 'flex'; 
    cameraFeed.innerHTML = '<button id="start-stream-btn" style="width: 80%; background-color: #3498db; color: #fff; height: 44px; font-size: 16px; font-weight: bold; border: none; border-radius: 4px; cursor: pointer;">Activate Warehouse Camera</button>'; 
    
    document.getElementById('start-stream-btn').addEventListener('click', startQrScanner); 
    
    proNumberInput.value = ""; 
    lengthInput.value = ""; 
    widthInput.value = ""; 
    heightInput.value = ""; 
    capturedDataUrl = ""; 
    takenImage.src = ''; 
    isScanningPaused = false; 
    
    validateForm(); 
}); 

// 3. Official Native iOS Share Sheet Menu Trigger (Bypasses Freeze Vulnerabilities) 
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
            throw new Error("Direct sharing profiles unavailable."); 
        } 
    } catch (error) { 
        console.error('File export tracking crash:', error); 
        
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

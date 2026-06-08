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
    html5QrcodeScanner = new Html5Qrcode("camera-feed");
    
    html5QrcodeScanner.start(
        { facingMode: "environment" }, // Focuses execution via back-facing lenses
        {
            fps: 10,       
            qrbox: 250     
        },
        (decodedText) => {
            // Evaluates text stream block content against 9-digit company pattern
            if (decodedText.match(/^\d{9}$/)) {
                proNumberInput.value = decodedText; 
                
                html5QrcodeScanner.stop().then(() => {
                    console.log("Pallet QR code extracted. Stream paused.");
                }).catch(err => console.error("Scanner tracking disconnect exception:", err));
                
                validateForm(); 
            }
        },
        (errorMessage) => {
            // Continues processing background frames seamlessly if parsing array is blank
        }
    ).catch(err => {
        console.error("Camera initial mount crash sequence:", err);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    startQrScanner();
});

// Canvas Freeze Frame Drawing Engine
takePictureBtn.addEventListener('click', () => {
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
    
    if(html5QrcodeScanner && html5QrcodeScanner.isScanning) {
        html5QrcodeScanner.stop();
    }
    
    validateForm(); 
});

redoButton.addEventListener('click', () => {
    document.body.appendChild(takenImage);
    cameraFeed.style.display = 'block';
    
    startQrScanner();
    
    capturedDataUrl = "";
    takenImage.src = '';
    validateForm(); 
});

// Native iOS File Export Interfacing
uploadButton.addEventListener('click', () => {
    uploadButton.disabled = true;
    uploadButton.textContent = "Saving to Device Files...";

    const fileName = `PRO_${proNumberInput.value}_DIM_${lengthInput.value}x${widthInput.value}x${heightInput.value}.jpg`;

    const downloadLink = document.createElement('a');
    downloadLink.href = capturedDataUrl;
    downloadLink.download = fileName;

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    alert('Stamped image exported directly to local iPhone Storage!');
    
    document.querySelectorAll('input').forEach(i => i.value = '');
    redoButton.click();
});

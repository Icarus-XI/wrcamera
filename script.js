// Get elements
const takePictureBtn = document.getElementById('take-picture-btn');
const redoButton = document.getElementById('redo-button');
const uploadButton = document.getElementById('upload-button');
const cameraFeed = document.getElementById('camera-feed');
const takenImage = document.getElementById('taken-image');

// Form Input Elements
const proNumberInput = document.getElementById('pro-number');
const lengthInput = document.getElementById('length');
const widthInput = document.getElementById('width');
const heightInput = document.getElementById('height');

// Global tracking variable for the captured data URL
let capturedDataUrl = "";
let html5QrcodeScanner = null; // Global reference for the QR reader engine

// Helper function to check if form is completely valid
function validateForm() {
    const hasImage = capturedDataUrl !== "";
    const isProValid = proNumberInput.checkValidity() && proNumberInput.value.trim() !== "";
    const isLengthValid = lengthInput.value !== "";
    const isWidthValid = widthInput.value !== "";
    const isHeightValid = heightInput.value !== "";

    // Enable button only if ALL conditions are true
    uploadButton.disabled = !(hasImage && isProValid && isLengthValid && isWidthValid && isHeightValid);
}

// Attach live input listeners to auto-validate as the user types
[proNumberInput, lengthInput, widthInput, heightInput].forEach(input => {
    input.addEventListener('input', validateForm);
});

// START AUTO SCANNER ENGINE
function startQrScanner() {
    // Links background engine directly to your container block ID
    html5QrcodeScanner = new Html5Qrcode("camera-feed");
    
    html5QrcodeScanner.start(
        { facingMode: "environment" }, // Forces back-facing camera on phones
        {
            fps: 10,       // Process 10 video frames per second
            qrbox: 250     // Visual boundary scan target box size
        },
        (decodedText) => {
            // Check if scanned text matches your company's 9-digit PRO pattern
            if (decodedText.match(/^\d{9}$/)) {
                proNumberInput.value = decodedText; // Drop code into form input
                
                // Stop scanner stream immediately so it doesn't loop overwrite data
                html5QrcodeScanner.stop().then(() => {
                    console.log("QR Scan successful. Engine paused.");
                }).catch(err => console.error("Error pausing QR stream:", err));
                
                validateForm(); // Re-verify button unlock state
            }
        },
        (errorMessage) => {
            // Silent catch: Keeps cycling smoothly if no barcode/QR is currently in frame
        }
    ).catch(err => {
        console.error("Unable to initialize background camera track:", err);
    });
}

// Fire the scanner automatically upon page boot sequence
document.addEventListener("DOMContentLoaded", () => {
    startQrScanner();
});

// 1. Take Picture Event
takePictureBtn.addEventListener('click', () => {
    const canvas = document.createElement('canvas');
    
    // Grabs the scanner library's internally generated video element layer
    const activeVideoTrack = cameraFeed.querySelector('video') || cameraFeed;
    
    canvas.width = activeVideoTrack.videoWidth || 640;
    canvas.height = activeVideoTrack.videoHeight || 480;
    const context = canvas.getContext('2d');

    // Draw the live camera video frame onto the canvas
    context.drawImage(activeVideoTrack, 0, 0);

    // Collect current form values for the text overlay
    const proNumber = proNumberInput.value || 'N/A';
    const length = lengthInput.value || '0';
    const width = widthInput.value || '0';
    const height = heightInput.value || '0';
    const timestamp = new Date().toLocaleString();

    // Configure text styling
    context.font = 'bold 20px Arial';
    context.textBaseline = 'top';

    // Define data lines to print
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

    // Draw semi-transparent black background block
    context.fillStyle = 'rgba(0, 0, 0, 0.65)';
    context.fillRect(x, y, boxWidth, boxHeight);

    // Print each line of text inside the background block
    context.fillStyle = '#ffffff';
    lines.forEach((line, index) => {
        const textY = y + 10 + (index * 26);
        context.fillText(line, x + 12, textY);
    });

    // Export the final stamped canvas image to your preview window
    capturedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
    takenImage.src = capturedDataUrl;

    // MOVE ELEMENTS IN-PLACE: Swaps the image to the top and hides camera feed container
    cameraFeed.insertAdjacentElement('beforebegin', takenImage);
    cameraFeed.style.display = 'none';
    
    // If QR Scanner was active, ensure it shuts down cleanly when photo freezes
    if(html5QrcodeScanner && html5QrcodeScanner.isScanning) {
        html5QrcodeScanner.stop();
    }
    
    validateForm(); // Recheck form validation
});

// 2. Redo Button Event
redoButton.addEventListener('click', () => {
    // MOVE ELEMENTS BACK: Returns the image to the bottom of the document body
    document.body.appendChild(takenImage);
    cameraFeed.style.display = 'block';
    
    // Reactivate the auto scanning engine loop for the next pallet scan
    startQrScanner();
    
    capturedDataUrl = "";
    takenImage.src = '';
    validateForm(); // Instantly disable upload button
});

// 3. Upload Event (Preserved fallback container)
uploadButton.addEventListener('click', () => {
    uploadButton.disabled = true;
    uploadButton.textContent = "Uploading...";
    
    axios.post('/upload', {
        proNumber: proNumberInput.value,
        length: lengthInput.value,
        width: widthInput.value,
        height: heightInput.value,
        imageData: capturedDataUrl
    })
    .then(response => {
        alert('Upload successful!');
        document.querySelectorAll('input').forEach(i => i.value = '');
        redoButton.click();
    })
    .catch(error => {
        alert('Upload failed. Check console.');
        console.error(error);
        uploadButton.disabled = false;
    })
    .finally(() => {
        uploadButton.textContent = "Upload to Network Share";
    });
});

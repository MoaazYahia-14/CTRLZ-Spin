const prizes = [
    "CTRLZ Medal",
    "NoteBook CTRLZ",
    "Stickers Laptop",
    "Promo Code 50%",
    "5 Posters Free",
    "30% off Design",
    "50% off Design",
    "Christmas Gift",
    "CTRL Z Gift",
    "Calendar 2026"
];

// Elements
const wheel = document.getElementById('wheel');
const spinBtn = document.getElementById('spin-btn');
const resultModal = document.getElementById('result-modal');
const winnerText = document.getElementById('winner-text');
const downloadBtn = document.getElementById('download-btn');

// Config
const numSegments = prizes.length;
const segmentAngle = 360 / numSegments;
const colors = ['#f7e300', '#ffffff']; // Yellow, White

let currentRotation = 0;
let isSpinning = false;

// SVG Config
const wheelSize = 400; // Matches CSS
const center = wheelSize / 2;
const radius = wheelSize / 2;

function createWheelSVG() {
    // Clear existing
    wheel.innerHTML = '';

    // Create SVG Element
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", `0 0 ${wheelSize} ${wheelSize}`);
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.style.borderRadius = "50%";

    // Create Sectors
    prizes.forEach((prize, index) => {
        const startAngle = index * segmentAngle;
        const endAngle = (index + 1) * segmentAngle;

        // Convert to Radians
        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;

        // Coordinates for Path
        const x1 = center + radius * Math.cos(startRad);
        const y1 = center + radius * Math.sin(startRad);
        const x2 = center + radius * Math.cos(endRad);
        const y2 = center + radius * Math.sin(endRad);

        // Create Wedge Path
        const pathData = [
            `M ${center} ${center}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 0 1 ${x2} ${y2}`,
            `Z`
        ].join(' ');

        const path = document.createElementNS(ns, "path");
        path.setAttribute("d", pathData);
        path.setAttribute("fill", colors[index % colors.length]);
        path.setAttribute("stroke", "#ffffff"); // Border
        path.setAttribute("stroke-width", "2");

        svg.appendChild(path);

        // Text Placement
        const midAngle = startAngle + (segmentAngle / 2);
        const midRad = (midAngle * Math.PI) / 180;

        // Radius: Start 50px from center to clear hub
        // We actually want the Center of the text to be somewhere reasonable.
        // Let's use text-anchor start and a fixed radius offset.
        // Actually, previous logic used middle.

        // Let's verify 'True Centering'.
        // User wants midpoint of string aligned with center.
        // `text-anchor="middle"` does this horizontally.
        // `dominant-baseline="middle"` does this vertically.
        // Position: (Center + Radius/2 + HubClearance)? 
        // Available space: 50px (hub) to 200px (rim). Midpoint: 125px.
        const textRadius = 125;

        const tx = center + textRadius * Math.cos(midRad);
        const ty = center + textRadius * Math.sin(midRad);

        const text = document.createElementNS(ns, "text");
        text.setAttribute("x", tx);
        text.setAttribute("y", ty);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("dominant-baseline", "middle");
        text.setAttribute("fill", "#000000");

        // Font
        text.setAttribute("font-family", "Montserrat, sans-serif");
        text.setAttribute("font-weight", "700");
        text.setAttribute("font-size", "14");

        // Rotate text to follow spoke
        text.setAttribute("transform", `rotate(${midAngle}, ${tx}, ${ty})`);

        text.textContent = prize;

        svg.appendChild(text);
    });

    wheel.appendChild(svg);
}

// Sound Effects
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTickSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}
function playWinSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime + (i * 0.1));
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + (i * 0.1) + 1);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + (i * 0.1));
        osc.stop(audioCtx.currentTime + (i * 0.1) + 1);
    });
}

function spin() {
    if (isSpinning) return;
    isSpinning = true;

    resultModal.classList.add('hidden');
    spinBtn.disabled = true;

    // 1. Pick Winner
    const winningIndex = Math.floor(Math.random() * numSegments);
    const winner = prizes[winningIndex];

    // 2. Logic to Align Winner to Top (-90 deg)
    const targetMidAngle = (winningIndex * segmentAngle) + (segmentAngle / 2);
    const goalAngle = -90;
    const jitter = Math.floor(Math.random() * 20) - 10;

    const finalGoal = goalAngle + jitter;
    let requiredRotation = finalGoal - targetMidAngle;

    // Normalize and add spins
    const minSpins = 360 * 5;
    while (requiredRotation < currentRotation + minSpins) {
        requiredRotation += 360;
    }

    currentRotation = requiredRotation;

    wheel.style.transform = `rotate(${currentRotation}deg)`;

    // Updated Duration: 5 seconds with smoother ease curve
    const duration = 5000;
    let tickDelay = 50;
    let timePassed = 0;
    function tickLoop() {
        if (!isSpinning) return;
        playTickSound();
        timePassed += tickDelay;
        if (timePassed < duration) {
            // Logarithmic/Quadratic ease for ticks
            const progress = timePassed / duration;
            tickDelay = 20 + (Math.pow(progress, 2) * 400);
            setTimeout(tickLoop, tickDelay);
        }
    }
    tickLoop();

    setTimeout(() => {
        winnerText.innerText = winner;

        resultModal.classList.remove('hidden');
        playWinSound();
        isSpinning = false;
        // spinBtn.disabled = false; // Disable permanently
        spinBtn.classList.add('disabled-permanently');
    }, duration);
}

function captureResult() {
    const modalContent = document.querySelector('.modal-content');

    html2canvas(modalContent, {
        backgroundColor: '#1e1e1e',
        scale: 2
    }).then(canvas => {
        canvas.toBlob(async (blob) => {
            const file = new File([blob], "CTRLZ-Prize.png", { type: "image/png" });

            // Try Web Share API (Mobile native share)
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        files: [file],
                        title: 'I Won!',
                        text: 'Look at what I won at CTRLZ Wheel of Fortune! 🎉',
                    });
                } catch (err) {
                    console.log('Share failed', err);
                    // Fallback to download if user cancelled or failed
                }
            } else {
                // Fallback for Desktop:
                // 1. Download image
                const link = document.createElement('a');
                link.download = 'CTRLZ-Prize.png';
                link.href = canvas.toDataURL('image/png');
                link.click();

                // 2. Open WhatsApp Text Link
                const winnerTextContent = document.getElementById('winner-text').innerText;
                const message = `I just won ${winnerTextContent} at CTRLZ Wheel of Fortune! 🎉 Claim yours now!`;
                const whatsappUrl = `https://wa.me/201097545329?text=${encodeURIComponent(message)}`;

                setTimeout(() => {
                    window.open(whatsappUrl, '_blank');
                    alert("Image downloaded! Please attach it to the WhatsApp chat that just opened.");
                }, 1000);
            }
        });
    });
}

spinBtn.addEventListener('click', spin);
downloadBtn.addEventListener('click', captureResult);
createWheelSVG();

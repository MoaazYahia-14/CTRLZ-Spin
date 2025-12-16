const prizes = [
    "CTRLZ Medal",
    "NoteBook CTRLZ",
    "Stickers Laptop",
    "1111111111111111",
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
        // Midpoint: 125px.
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

// --- Meteor & Starry Background System ---
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

let starsArray = [];
let meteorsArray = [];
let logosArray = [];

// Assets
const logoImg = new Image();
logoImg.src = 'logo.jpg';

// Sizing
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', () => {
    resizeCanvas();
    initBackground();
});
resizeCanvas();

// --- Classes ---

// 1. Star (Static/Breathing Dots)
class Star {
    constructor() {
        this.init();
    }

    init() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 1.5; // Tiny dots
        this.opacityBase = Math.random() * 0.5 + 0.1;
        this.opacity = this.opacityBase;
        this.twinkleSpeed = Math.random() * 0.02 + 0.005;
        this.angle = Math.random() * Math.PI * 2;
    }

    update() {
        // Twinkle effect
        this.angle += this.twinkleSpeed;
        this.opacity = this.opacityBase + Math.sin(this.angle) * 0.1;
        if (this.opacity < 0) this.opacity = 0;
    }

    draw() {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 2. Meteor (Shooting Lines)
class Meteor {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height * 0.5; // Start mostly top half
        this.len = Math.random() * 80 + 10;
        this.speed = Math.random() * 10 + 5;
        this.size = Math.random() * 1 + 0.1;
        // Angle: mostly downwards diagonal
        this.angle = Math.PI / 4 + (Math.random() * 0.2 - 0.1);
        this.dirX = Math.cos(this.angle);
        this.dirY = Math.sin(this.angle);

        // Start off-screen or fade in? 
        this.life = 0;
        this.maxLife = Math.random() * 100 + 50;
        this.opacity = 0;
    }

    update() {
        this.x += this.dirX * this.speed;
        this.y += this.dirY * this.speed;
        this.life++;

        // Fade in/out
        if (this.life < 10) this.opacity += 0.1;
        else if (this.life > this.maxLife - 10) this.opacity -= 0.1;

        if (this.opacity < 0 || this.x > canvas.width || this.y > canvas.height) {
            this.reset();
            // Random respawn delay hack: move way off screen
            this.x = Math.random() * canvas.width;
            this.y = -100;
            this.life = 0;
            this.opacity = 0;
        }
    }

    draw() {
        // Trail gradient
        const gradient = ctx.createLinearGradient(
            this.x, this.y,
            this.x - this.dirX * this.len,
            this.y - this.dirY * this.len
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${this.opacity})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = this.size;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.dirX * this.len, this.y - this.dirY * this.len);
        ctx.stroke();
    }
}

// 3. Floating Logo (Existing but tuned)
class LogoParticle {
    constructor() {
        this.init();
    }

    init() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = (Math.random() * 10) + 10; // Slightly larger for visibility
        this.speedX = (Math.random() * 0.4) - 0.2;
        this.speedY = (Math.random() * 0.4) - 0.2;
        this.opacity = (Math.random() * 0.3) + 0.1;
        this.rotation = Math.random() * 360;
        this.rotationSpeed = (Math.random() * 0.2) - 0.1;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.rotation += this.rotationSpeed;

        if (this.x < -this.size * 2) this.x = canvas.width + this.size;
        else if (this.x > canvas.width + this.size) this.x = -this.size;

        if (this.y < -this.size * 2) this.y = canvas.height + this.size;
        else if (this.y > canvas.height + this.size) this.y = -this.size;
    }

    draw() {
        if (!logoImg.complete) return;

        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation * Math.PI / 180);

        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        ctx.drawImage(logoImg, -this.size, -this.size, this.size * 2, this.size * 2);
        ctx.restore();
    }
}

// Initialization
function initBackground() {
    starsArray = [];
    meteorsArray = [];
    logosArray = [];

    const area = canvas.width * canvas.height;

    // Stars Density
    const numStars = Math.floor(area / 3000);
    for (let i = 0; i < numStars; i++) starsArray.push(new Star());

    // Meteors Count (Keep low for "rare" effect)
    const numMeteors = 6;
    for (let i = 0; i < numMeteors; i++) meteorsArray.push(new Meteor());

    // Logos Count
    const numLogos = window.innerWidth < 768 ? 4 : 8;
    for (let i = 0; i < numLogos; i++) logosArray.push(new LogoParticle());
}

// Animation Loop
function animateBackground() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Stars
    starsArray.forEach(star => { star.update(); star.draw(); });

    // Draw Meteors
    meteorsArray.forEach(meteor => { meteor.update(); meteor.draw(); });

    // Draw Logos
    logosArray.forEach(logo => { logo.update(); logo.draw(); });

    requestAnimationFrame(animateBackground);
}

// Start
initBackground();
animateBackground();

// Scroll Animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target); // Only animate once
        }
    });
}, observerOptions);

document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));

// Start
spinBtn.addEventListener('click', spin);
downloadBtn.addEventListener('click', captureResult);
createWheelSVG();

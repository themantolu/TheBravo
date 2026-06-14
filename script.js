// Bravo Services Configuration
const services = [
    {
        title: "OBSERVERS MANAGEMENT",
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`
    },
    {
        title: "ELECTION RESULTS",
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`
    },
    {
        title: "FORENSICS + WITNESSES",
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`
    },
    {
        title: "CALL CENTER",
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>`
    },
    {
        title: "PETITIONS SUPPORT",
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`
    },
    {
        title: "SITUATION ROOMS",
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`
    }
];

// UI Interaction State
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let isExpanded = false;
let expandProgress = 0;

// DOM Selectors
const nodesContainer = document.getElementById('nodes-container');
const lineCanvas = document.getElementById('network-lines');
const ctx = lineCanvas.getContext('2d');
const nodeObjects = [];

const particleCanvas = document.getElementById('particle-bg');
const pCtx = particleCanvas.getContext('2d');
let particles = [];

// Canvas Sizing and Window Scaling
function resizeCanvas() {
    lineCanvas.width = window.innerWidth;
    lineCanvas.height = window.innerHeight;
    particleCanvas.width = window.innerWidth;
    particleCanvas.height = window.innerHeight;
    
    // Max spread limit calculated dynamically
    const isMobile = window.innerWidth < 768;
    window.maxSpreadRadius = isMobile ? Math.min(window.innerWidth * 0.45, 160) : Math.min(window.innerWidth * 0.35, 380);
    
    initParticles();
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Interactive Hover and Target Proximities
document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const dist = Math.hypot(mouseX - centerX, mouseY - centerY);
    
    // Expand when hover is close to center logo
    const activeZone = isExpanded ? window.maxSpreadRadius + 100 : (window.innerWidth < 768 ? 160 : 220);
    
    if (dist < activeZone) {
        isExpanded = true;
    } else {
        isExpanded = false;
    }
});

// Touch Events for Mobile (Tap to expand/retract)
const logoEl = document.getElementById('bravo-logo');
logoEl.addEventListener('touchstart', (e) => {
    if (window.innerWidth < 768) {
        e.preventDefault();
        isExpanded = !isExpanded;
        mouseX = window.innerWidth / 2;
        mouseY = window.innerHeight / 2;
    }
});

// Render nodes in circle layout
services.forEach((service, index) => {
    const el = document.createElement('div');
    el.className = 'service-card';
    el.innerHTML = `
        <div class="icon-box">${service.icon}</div>
        <div class="service-title">${service.title}</div>
    `;
    
    // Select specific option in modal dropdown
    el.addEventListener('click', () => {
        const select = document.getElementById('service-select');
        select.selectedIndex = index + 1;
        document.getElementById('service-modal').classList.add('active');
    });
    nodesContainer.appendChild(el);

    const angle = (Math.PI * 2) * (index / services.length) - (Math.PI / 2);
    nodeObjects.push({
        element: el,
        angle: angle,
        currentX: window.innerWidth / 2,
        currentY: window.innerHeight / 2
    });
});

// Nodes Spring & Connector line animation loop
function animateNodes() {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    ctx.clearRect(0, 0, lineCanvas.width, lineCanvas.height);

    const targetProgress = isExpanded ? 1 : 0;
    expandProgress += (targetProgress - expandProgress) * 0.12; 

    const currentRadius = 80 + (window.maxSpreadRadius * expandProgress);
    const cardWidth = window.innerWidth < 768 ? 200 : 260; 
    const cardHeight = window.innerWidth < 768 ? 50 : 60;
    const margin = 10;

    nodeObjects.forEach((node) => {
        let targetX = centerX + Math.cos(node.angle) * currentRadius;
        let targetY = centerY + Math.sin(node.angle) * currentRadius;

        // Prevent nodes from flowing off-screen
        targetX = Math.max(cardWidth / 2 + margin, Math.min(window.innerWidth - cardWidth / 2 - margin, targetX));
        targetY = Math.max(cardHeight / 2 + margin, Math.min(window.innerHeight - cardHeight / 2 - margin, targetY));

        // Smooth position translation
        node.currentX += (targetX - node.currentX) * 0.15;
        node.currentY += (targetY - node.currentY) * 0.15;

        node.element.style.left = `${node.currentX}px`;
        node.element.style.top = `${node.currentY}px`;
        node.element.style.opacity = expandProgress;
        node.element.style.pointerEvents = expandProgress > 0.5 ? 'all' : 'none';

        if (expandProgress > 0.1) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(34, 197, 94, ${expandProgress * 0.4})`;
            ctx.lineWidth = 1.5;
            
            const startRadius = window.innerWidth < 768 ? 100 : 160;
            const startX = centerX + Math.cos(node.angle) * startRadius;
            const startY = centerY + Math.sin(node.angle) * startRadius;
            
            if (currentRadius > startRadius) {
                ctx.moveTo(startX, startY);
                ctx.lineTo(node.currentX, node.currentY);
                ctx.stroke();
            }
        }
    });

    requestAnimationFrame(animateNodes);
}
animateNodes();

// Background Interactive Particles (Checks, Ballots, and Nodes)
function initParticles() {
    particles = [];
    const particleCount = Math.floor((window.innerWidth * window.innerHeight) / 15000); 
    for(let i=0; i<particleCount; i++) {
        particles.push({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            radius: Math.random() * 2 + 1,
            type: Math.floor(Math.random() * 3)
        });
    }
}

function animateParticles() {
    pCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);

    for(let i=0; i<particles.length; i++) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if(p.x < 0 || p.x > particleCanvas.width) p.vx *= -1;
        if(p.y < 0 || p.y > particleCanvas.height) p.vy *= -1;

        let dx = mouseX - p.x;
        let dy = mouseY - p.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        
        if(dist < 180) {
             pCtx.beginPath();
             pCtx.strokeStyle = `rgba(34, 197, 94, ${(1 - dist/180) * 0.2})`;
             pCtx.lineWidth = 1;
             pCtx.moveTo(p.x, p.y);
             pCtx.lineTo(mouseX, mouseY);
             pCtx.stroke();
        }

        pCtx.beginPath();
        pCtx.fillStyle = 'rgba(34, 197, 94, 0.4)';
        pCtx.strokeStyle = 'rgba(34, 197, 94, 0.5)';
        pCtx.lineWidth = 1.5;

        if (p.type === 0) {
            pCtx.arc(p.x, p.y, p.radius * 1.5, 0, Math.PI * 2);
            pCtx.fill();
        } else if (p.type === 1) {
            pCtx.moveTo(p.x - 4, p.y);
            pCtx.lineTo(p.x - 1, p.y + 4);
            pCtx.lineTo(p.x + 5, p.y - 4);
            pCtx.stroke();
        } else {
            pCtx.strokeRect(p.x - 4, p.y - 5, 8, 10);
            pCtx.moveTo(p.x - 2, p.y - 2); pCtx.lineTo(p.x + 2, p.y - 2);
            pCtx.moveTo(p.x - 2, p.y + 1); pCtx.lineTo(p.x + 2, p.y + 1);
            pCtx.stroke();
        }
    }
    requestAnimationFrame(animateParticles);
}
animateParticles();

// Three.js 3D Glass Ballot Box setup
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 22;

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

const boxGroup = new THREE.Group();

// White physical glass box mesh
const boxGeo = new THREE.BoxGeometry(6, 8, 6);
const boxMat = new THREE.MeshPhysicalMaterial({ 
    color: 0xffffff, 
    roughness: 0.2, 
    metalness: 0.1,
    clearcoat: 0.8,
    clearcoatRoughness: 0.2,
    transmission: 0.3,
    opacity: 1
});
const mainBox = new THREE.Mesh(boxGeo, boxMat);

const edges = new THREE.EdgesGeometry(boxGeo);
const lineMat = new THREE.LineBasicMaterial({ color: 0x86efac, linewidth: 2 });
const boxLines = new THREE.LineSegments(edges, lineMat);
mainBox.add(boxLines);

// Top Green Slot
const slotGeo = new THREE.BoxGeometry(3, 0.2, 0.6);
const slotMat = new THREE.MeshBasicMaterial({ color: 0x16a34a });
const slot = new THREE.Mesh(slotGeo, slotMat);
slot.position.y = 4.05; 

// Dropping Ballot Paper Mesh
const paperGeo = new THREE.PlaneGeometry(2.5, 3.5);
const paperMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
const paper = new THREE.Mesh(paperGeo, paperMat);
paper.position.set(0, 5.5, 0);
paper.rotation.x = Math.PI / 2 - 0.2; 

const paperEdges = new THREE.EdgesGeometry(paperGeo);
const paperLineMat = new THREE.LineBasicMaterial({ color: 0x22c55e });
const paperLines = new THREE.LineSegments(paperEdges, paperLineMat);
paper.add(paperLines);

boxGroup.add(mainBox);
boxGroup.add(slot);
boxGroup.add(paper);

boxGroup.rotation.x = 0.2;
boxGroup.rotation.y = -0.5;
scene.add(boxGroup);

// Ambient and Directional Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(10, 20, 10);
scene.add(dirLight);

const greenFillLight = new THREE.DirectionalLight(0x4ade80, 0.4);
greenFillLight.position.set(-10, 0, -10);
scene.add(greenFillLight);

let paperOffsetY = 0;

function animate3D() {
    requestAnimationFrame(animate3D);

    const normalizedMouseX = (mouseX / window.innerWidth) * 2 - 1;
    const normalizedMouseY = -(mouseY / window.innerHeight) * 2 + 1;

    const targetRotY = normalizedMouseX * Math.PI * 0.3;
    const targetRotX = normalizedMouseY * Math.PI * 0.1 + 0.2;

    boxGroup.rotation.y += (targetRotY - boxGroup.rotation.y) * 0.05;
    boxGroup.rotation.x += (targetRotX - boxGroup.rotation.x) * 0.05;

    paperOffsetY += 0.02;
    paper.position.y = 4.5 + Math.sin(paperOffsetY) * 1.2;

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

window.onload = () => {
    animate3D();
};

// Modal Interaction Controls
const modal = document.getElementById('service-modal');
const openBtn = document.getElementById('open-modal-btn');
const closeBtn = document.getElementById('close-modal');
const form = document.getElementById('service-form');

openBtn.addEventListener('click', () => modal.classList.add('active'));
closeBtn.addEventListener('click', () => modal.classList.remove('active'));

modal.addEventListener('click', (e) => {
    if(e.target === modal) modal.classList.remove('active');
});

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    
    btn.textContent = 'Request Sent ✓';
    btn.style.background = '#059669';
    
    setTimeout(() => {
        modal.classList.remove('active');
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
            form.reset();
        }, 300);
    }, 1500);
});

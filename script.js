// UI Mouse Tracking State (for 3D Box tracking)
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});



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
    if (e.target === modal) modal.classList.remove('active');
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

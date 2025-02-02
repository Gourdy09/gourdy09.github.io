const crosshair = document.querySelector('.crosshair');

const prevMousePos = {x: 0, y: 0};
const mousePos = {x: 0, y: 0};
const crosshairPos = {x: 0, y: 0};

let currentScale = 0;
let currentAngle = 0;

const speed = 0.17;

window.onload = () => {

    window.location.href = '/';
    
    const storedX = sessionStorage.getItem('cursorX');
    const storedY = sessionStorage.getItem('cursorY');

    // If there is a stored position, use it
    if (storedX && storedY) {
        crosshairPos.x = parseFloat(storedX);
        crosshairPos.y = parseFloat(storedY);

        crosshair.style.left = `${crosshairPos.x}px`;
        crosshair.style.top = `${crosshairPos.y}px`;
    }
};

// Track mouse movement
window.addEventListener('mousemove', (e) => {
    mousePos.x = e.x;
    mousePos.y = e.y;

    sessionStorage.setItem('cursorX', mousePos.x);
    sessionStorage.setItem('cursorY', mousePos.y);
});

const tick = () => {
    crosshairPos.x += (mousePos.x - crosshairPos.x) * speed;
    crosshairPos.y += (mousePos.y - crosshairPos.y) * speed;
    
    crosshair.style.left = `${crosshairPos.x}px`;
    crosshair.style.top = `${crosshairPos.y}px`;

    const deltaMouseX = mousePos.x - prevMousePos.x;
    const deltaMouseY = mousePos.y - prevMousePos.y;
    prevMousePos.x = mousePos.x;
    prevMousePos.y = mousePos.y;

    const mouseVelocity = Math.min(Math.sqrt(deltaMouseX ** 2 + deltaMouseY ** 2) * 16, 200);
    const scaleValue = (mouseVelocity / 200) * 0.5;
    currentScale += (scaleValue - currentScale) * speed;

    const scaleTransform = `scale(${1 + currentScale}, ${1 - currentScale})`;
    const angle = Math.atan2(deltaMouseY, deltaMouseX);
    if (mouseVelocity > 10) {
        currentAngle = angle;
    }
    const rotateTransform = `rotate(${currentAngle}rad)`;

    crosshair.style.transform = `${rotateTransform} ${scaleTransform}`;
    window.requestAnimationFrame(tick);
};

tick();

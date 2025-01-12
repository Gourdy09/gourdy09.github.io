const crosshair = document.querySelector('.crosshair');

const prevMousePos = {x: 0, y: 0};
const mousePos = {x: 0, y: 0};
const crosshiarPos = {x: 0, y: 0};

let currentScale = 0;
let currentAngle = 0;

const speed = 0.17;

window.addEventListener('mousemove', (e) =>{
    mousePos.x = e.x;
    mousePos.y = e.y;
});

const tick = () => {
    crosshiarPos.x += (mousePos.x - crosshiarPos.x) * speed;
    crosshiarPos.y += (mousePos.y - crosshiarPos.y) * speed;
    const translateTransform = `translate(${crosshiarPos.x}px, ${crosshiarPos.y}px)`;
    const deltaMouseX = mousePos.x - prevMousePos.x;
    const deltaMouseY = mousePos.y - prevMousePos.y;
    prevMousePos.x = mousePos.x;
    prevMousePos.y = mousePos.y;
    const mouseVelocity = Math.min(Math.sqrt(deltaMouseX ** 2 + deltaMouseY ** 2) * 16, 200);
    const scaleValue = (mouseVelocity / 200) * 0.5;
    currentScale += (scaleValue - currentScale) * speed;
    
    const scaleTransform = `scale(${1 + currentScale}, ${1 - currentScale})`;
    const angle = Math.atan2(deltaMouseY, deltaMouseX);
    if(mouseVelocity > 10){
        currentAngle = angle;
    }
    const rotateTransform = `rotate(${currentAngle}rad)`;
    crosshair.style.transform = `${translateTransform} ${rotateTransform} ${scaleTransform}`;
    window.requestAnimationFrame(tick);
}

tick();
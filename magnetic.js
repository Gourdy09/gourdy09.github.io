// Check if the user's platform is PC, Mac, or Linux
const isDesktop = /win|mac|linux/i.test(navigator.platform.toLowerCase());

if (isDesktop) {
    const magnetics = document.querySelectorAll('.magnetic'); // Get all .magnetic elements
    magnetics.forEach(magnetic => {
        let boundingRect = magnetic.getBoundingClientRect();
        
        // Define movement limits as a percentage of the element's width/height
        const MAX_MOVE_X = 25; // Max move in X direction (in pixels or as a percentage)
        const MAX_MOVE_Y = 25; // Max move in Y direction (in pixels or as a percentage)
        
        // Update boundingRect on resize
        window.addEventListener('resize', () => {
            boundingRect = magnetic.getBoundingClientRect();
        });

        // Mousemove event for animation
        magnetic.addEventListener('mousemove', (e) => {
            let boundingRect = magnetic.getBoundingClientRect();
            const mousePosX = e.pageX - boundingRect.left;
            const mousePosY = e.pageY - boundingRect.top;
            
            // Calculate the movement, but clamp it to the defined limits
            const moveX = (mousePosX - boundingRect.width * 0.5) * 0.4;
            const moveY = (mousePosY - boundingRect.height * 0.5) * 0.4;
            
            // Limit the movement within the bounds
            const clampedX = Math.max(-MAX_MOVE_X, Math.min(MAX_MOVE_X, moveX));
            const clampedY = Math.max(-MAX_MOVE_Y, Math.min(MAX_MOVE_Y, moveY));
            
            // Apply the animation with clamped values
            gsap.to(magnetic, {
                scale: 1.1,
                x: clampedX,
                y: clampedY,
                duration: 0.8,
                ease: 'power3.out'
            });
        });

        // Mouseleave event to reset position
        magnetic.addEventListener('mouseleave', () => {
            gsap.to(magnetic, {
                scale: 1,
                x: 0,
                y: 0,
                duration: 1,
                ease: 'elastic.out(1, 0.3)',
                clearProps: 'all'
            });
        });
    });
}

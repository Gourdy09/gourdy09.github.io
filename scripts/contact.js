const textareas = document.querySelectorAll('textarea');

textareas.forEach(textarea => {
    textarea.addEventListener('input', () => {
        // Reset the height to auto to allow resizing based on content
        textarea.style.height = 'auto';
        // Set the height to the scrollHeight (height based on content)
        textarea.style.height = textarea.scrollHeight + 'px';
    });
});

document.addEventListener('DOMContentLoaded', function() {

    emailjs.init("68J7U4uSlIhqjwfMp");
    
    const name = document.getElementById("name");
    const email = document.getElementById("email");
    const message = document.getElementById("message");


    if (name && email && message) {
        document.getElementById("contact-form").addEventListener("submit", function(event) {
            event.preventDefault();

            const nameValue = name.value;
            const emailValue = email.value;
            const messageValue = message.value;

            console.log(nameValue, emailValue, messageValue);
            
            emailjs.sendForm('service_yre8bia', 'template_fxnzp3o', this)
                .then(function(response) {
                    console.log('Success:', response);
                    alert('Message sent successfully!');
                }, function(error) {
                    console.log('Failed:', error);
                    alert('Failed to send message. Please try again.');
                });
        });
    }
});


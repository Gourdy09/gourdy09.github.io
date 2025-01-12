document.addEventListener('DOMContentLoaded', () => {
  const homeBtn = document.getElementById('homeBtn');
  const projectsBtn = document.getElementById('projectsBtn');
  const contactBtn = document.getElementById('contactBtn');
  const experienceBtn = document.getElementById('experienceBtn');
  const toolsBtn = document.getElementById('toolsBtn');

  // Define your functions
  const openHome = () => {
    console.log('Open Home');
    // Add your navigation logic here
  };

  const openProjects = () => {
    console.log('Open Projects')
    
  };

  const openContact = () => {
    console.log('Open Contact');
    // Add your navigation logic here
  };

  const openExperience = () => {
    console.log('Open Experience');
    // Add your navigation logic here
  };

  const openTools = () => {
    console.log('Open Tools');
    // Add your navigation logic here
  };

  // Attach event listeners to buttons
  homeBtn.addEventListener('click', openHome);
  projectsBtn.addEventListener('click', openProjects);
  contactBtn.addEventListener('click', openContact);
  experienceBtn.addEventListener('click', openExperience);
  toolsBtn.addEventListener('click', openTools);
  }
);
  
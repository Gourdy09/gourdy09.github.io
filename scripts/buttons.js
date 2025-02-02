import { animatePageIn, animatePageOut, animatePageInInit } from './animations.js';

const isFirstLoad = sessionStorage.getItem('isFirstLoad');

// Run animatePageInInit on first load
window.onload = () => {
  if (!isFirstLoad) {
    animatePageInInit();
    sessionStorage.setItem('isFirstLoad', 'true');
  } else {
    animatePageIn();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const homeBtn = document.getElementById('homeBtn');
  const projectsBtn = document.getElementById('projectsBtn');
  const contactBtn = document.getElementById('contactBtn');
  const experienceBtn = document.getElementById('experienceBtn');
  const toolsBtn = document.getElementById('toolsBtn');

  const openHome = () => {
    console.log('Open Home');
    animatePageOut(() => {
      window.location.href = '/';
    });
  };

  const openProjects = () => {
    console.log('Open Projects');
    animatePageOut(() => {
      window.location.href = '/projects';
    });
  };

  const openContact = () => {
    console.log('Open Contact');
    animatePageOut(() => {
      window.location.href = '/contact';
    });
  };

  const openExperience = () => {
    console.log('Open Experience');
    animatePageOut(() => {
      window.location.href = '/experience';
    });
  };

  const openTools = () => {
    console.log('Open Tools');
    animatePageOut(() => {
      window.location.href = '/tools';
    });
  };

  homeBtn.addEventListener('click', openHome);
  projectsBtn.addEventListener('click', openProjects);
  contactBtn.addEventListener('click', openContact);
  experienceBtn.addEventListener('click', openExperience);
  toolsBtn.addEventListener('click', openTools);
});

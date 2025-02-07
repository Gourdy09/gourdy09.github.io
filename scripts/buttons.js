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
  const homeBtn = document.querySelectorAll('[id=homeBtn]');
  const projectsBtn = document.querySelectorAll('[id=projectsBtn]');
  const contactBtn = document.querySelectorAll('[id=contactBtn]');
  const experienceBtn = document.querySelectorAll('[id=experienceBtn]');
  const toolsBtn = document.querySelectorAll('[id=toolsBtn]');

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

  homeBtn.forEach(e => {
    e.addEventListener('click', openHome);
  });
  projectsBtn.forEach(e => {
    e.addEventListener('click', openProjects);
  });
  contactBtn.forEach(e => {
    e.addEventListener('click', openContact);
  });
  experienceBtn.forEach(e => {
    e.addEventListener('click', openExperience);
  });
  toolsBtn.forEach(e => {
    e.addEventListener('click', openTools);
  });
});

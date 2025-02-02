export const animatePageInInit = () => {
    const bannerOne = document.getElementById("banner-1")
    const bannerTwo = document.getElementById("banner-2")
    const bannerThree = document.getElementById("banner-3")
    const bannerFour = document.getElementById("banner-4")

    if(bannerOne && bannerTwo && bannerThree && bannerFour){
        const tl = gsap.timeline()

        tl.set([bannerOne, bannerTwo, bannerThree, bannerFour], {
            yPercent: 0,
        })
        .to([], { duration: 2 })
        .to([bannerOne, bannerTwo, bannerThree, bannerFour], {
            yPercent: 100,
            stagger: 0.1,
        })
    }
}

export const animatePageIn = () => {
    const bannerOne = document.getElementById("banner-1")
    const bannerTwo = document.getElementById("banner-2")
    const bannerThree = document.getElementById("banner-3")
    const bannerFour = document.getElementById("banner-4")

    if(bannerOne && bannerTwo && bannerThree && bannerFour){
        const tl = gsap.timeline()

        tl.set([bannerOne, bannerTwo, bannerThree, bannerFour], {
            yPercent: 0,
        })
        .to([bannerOne, bannerTwo, bannerThree, bannerFour], {
            yPercent: 100,
            stagger: 0.1,
        })
    }
}

export const animatePageOut = (navigate) => {
    const bannerOne = document.getElementById("banner-1");
    const bannerTwo = document.getElementById("banner-2");
    const bannerThree = document.getElementById("banner-3");
    const bannerFour = document.getElementById("banner-4");
  
    if (bannerOne && bannerTwo && bannerThree && bannerFour) {
      const tl = gsap.timeline();
  
      tl.set([bannerOne, bannerTwo, bannerThree, bannerFour], {
        yPercent: -100,
      })
        .to([bannerOne, bannerTwo, bannerThree, bannerFour], {
          yPercent: 0,
          stagger: 0.1,
        })
        .add(() => {
          if (typeof navigate === "function") {
            navigate();
          }
        });
    }
};
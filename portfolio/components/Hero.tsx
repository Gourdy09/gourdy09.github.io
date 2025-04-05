'use client';

import React from 'react'
import Image from 'next/image'
import Chip from './Chip'
import useMagneticEffect from '../hooks/useMagneticEffect'
import SocialBar from './SocialBar';

function Hero() {
  // Example of applying magnetic effect to another element
  const titleMagneticRef = useMagneticEffect({
    magneticArea: 150,    // Larger area
    magnetStrength: 0.3,  // Gentler effect
    returnDuration: 0.7,  // Slower return
    returnEase: "elastic.out(1, 0.2)" // Different elasticity
  });

  return (
    // Wrapper
    <div className='pt-60 bg-background flex items-center justify-center flex-col'>
        {/* Content */}
        <div className='flex flex-col mb-40'>

            {/* Top Row */}
            <div className='flex flex-row gap-4 items-center'>
                <Image className='rounded-full'
                    src="/GourdPFP.svg"
                    width={52}
                    height={52}
                    alt=""
                />
                <Chip
                    text="What's up, I'm Om"
                    area={70}
                />
            </div>

            {/* Mid Row */}
            <div className='flex flex-col gap-4'>

                <div className='flex flex-row gap-8 items-center'>
                    <h1 className='text-8xl font-extrabold text-text'>
                        <span className='text-primary'>AI</span> &
                    </h1>

                    <Chip
                        image="/Available.svg"
                        text="Let's talk"
                        magnetic={true}
                        area={70}
                        pulse={true}
                    />
                </div>
                
                <h1 
                    className='text-8xl font-extrabold text-secondary'
                >
                    ROBOTICS
                </h1>
                
                <h1 className='text-8xl font-extrabold text-text'>
                    DEVELOPER
                </h1>

                <h4 className='text-text text-xl'>
                    // Based in Houston, TX
                </h4>
            </div>

            
        </div>

        {/* Bot Row */}
        <div className='flex'>
            <SocialBar/>
        </div>
    </div>
  )
}

export default Hero
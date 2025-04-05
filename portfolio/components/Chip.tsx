'use client';

import Image from 'next/image'
import React from 'react'
import useMagneticEffect from '../hooks/useMagneticEffect'

interface ChipProps {
  text: string;
  image?: string;
  magnetic?: boolean;
  area?: number;
  width?: number;
  height?: number;
  pulse?: boolean,
}

function Chip({ text, image, area, width = 16, height = 16, magnetic = false, pulse = false }: ChipProps) {
    // Only apply magnetic effect if magnetic prop is true
    const magneticRef = useMagneticEffect(magnetic ? {
        magneticArea: area,
        magnetStrength: 0.4
    } : null);
    
    if(image != null && pulse) {
        return (
            <div 
                ref={magneticRef as React.RefObject<HTMLDivElement>}
                className='flex flex-row align-middle gap-3 border border-primary rounded-full px-4 py-2 max-h-16 items-center mt-4 cursor-pointer'>
                <Image className='rounded-full animate-pulse'
                    src={image}
                    width={width}
                    height={height}
                    alt=""
                />
                <Image className='rounded-full absolute'
                    src={image}
                    width={width}
                    height={height}
                    alt=""
                />
                <h1 className='text-text pl-1 pr-4 pt-1 pb-1 text-xl'>{text}</h1>
            </div>
        )    
    }
    else if(image != null && !pulse){
      return (
        <div
            ref={magneticRef as React.RefObject<HTMLDivElement>}
            className='flex flex-row align-middle gap-3 border border-primary rounded-full px-4 py-2 max-h-16 items-center mt-4'>

            <Image className='rounded-full bg-text px-1 py-1'
                src={image}
                width={width}
                height={height}
                alt=""
            />

            <h1 className='text-text pl-1 pr-4 pt-1 pb-1 text-xl'>{text}</h1>
        </div>
      )    
    }

    return (
        <div 
            ref={magneticRef as React.RefObject<HTMLDivElement>}
            className='border border-primary rounded-full px-4 py-2 max-h-16'
        >
            <h1 className='text-text pl-4 pr-4 pt-1 pb-1 text-xl'>{text}</h1>
        </div>
    )
}

export default Chip
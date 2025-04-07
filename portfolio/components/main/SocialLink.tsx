import Image from 'next/image'
import Link from 'next/link'
import React from 'react'


interface SocialLinkProps {
    link: string;
    image: string;
}

export default function SocialLink({link, image} : SocialLinkProps) {
  return (
    <div className='flex items-center align-middle rounded-full bg-text  px-1.5 py-1.5'>
        <Link href={link} rel="noopener noreferrer" target='_blank'>
            <Image className='rounded-full'
                src={image}
                width={28}
                height={28}
                alt=""
            />
        </Link>
    </div>
  )
}

"use client"

import Image from 'next/image'
import Link from 'next/link'

export function PartnersSection() {
  const partners = [
    {
      name: "ENS",
      description: "Ethereum Name Service",
      logo: "/ens.svg",
      url: "https://ens.domains/"
    },
    {
      name: "EFP",
      description: "Ethereum Follow Protocol", 
      logo: "/efp.webp",
      url: "https://collectors.poap.xyz/token/7376052"
    },
    {
      name: "Ethereum",
      description: "Blockchain Network",
      logo: "/eth.svg",
      url: "https://ethereum.org"
    },
    {
      name: "LUKSO",
      description: "Lifestyle Blockchain",
      logo: "/lukso.png",
      url: "https://lukso.network"
    },
    {
      name: "Farcaster",
      description: "Decentralized Social Network",
      logo: "/farcaster.png",
      url: "https://farcaster.xyz"
    },
    {
      name: "Telegram",
      description: "Messaging Platform",
      logo: "/telegram.svg",
      url: "https://telegram.org"
    },
    {
      name: "Hats Protocol",
      description: "Onchain Roles & Permissions",
      logo: "/hats.webp",
      url: "https://www.hatsprotocol.xyz/"
    },
    {
      name: "Circles",
      description: "Basic Income Protocol",
      logo: "/circles.svg",
      url: "https://aboutcircles.com"
    },
    {
      name: "Common Ground",
      description: "Web3 Community Platform",
      logo: "/cg_color.svg",
      url: "https://commonground.cg"
    }
  ]

  return (
    <section className="py-8 sm:py-12 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 no-horizontal-scroll">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-6">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Built for the decentralized web
          </p>
          
          {/* Partners Row - Horizontal Scroll */}
          <div className="flex overflow-x-auto gap-6 items-center justify-center md:justify-center pb-2 scrollbar-hide">
            <div className="flex gap-6 items-center min-w-max px-4 md:px-0">
            {partners.map((partner, index) => (
              <Link
                key={partner.name}
                href={partner.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center space-y-2 opacity-60 hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                {/* Actual Logo */}
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-white/80 dark:bg-slate-800/80 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow duration-300 p-2">
                  <Image
                    src={partner.logo}
                    alt={`${partner.name} logo`}
                    width={48}
                    height={48}
                    className="w-full h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300"
                  />
                </div>
                
                {/* Partner Name (hidden on mobile, shown on hover) */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 text-center">
                    {partner.name}
                  </p>
                </div>
              </Link>
            ))}
            </div>
          </div>
          
          {/* Subtitle */}
          <p className="text-sm text-slate-500 dark:text-slate-500 max-w-2xl mx-auto">
            Seamlessly integrates with the tools and protocols your users already know and love
          </p>
        </div>
      </div>
    </section>
  )
} 
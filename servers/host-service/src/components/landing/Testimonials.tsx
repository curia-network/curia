'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Users, MessageSquare, TrendingUp } from 'lucide-react';

const communityStories = [
  {
    id: 1,
    name: "StakingVerse",
    category: "DeFi Community",
    image: "/customers/stakingverse.jpg",
    description: "Transformed their Discord-heavy community into an engaging Web3 forum with token-gated discussions and seamless ENS authentication.",
    quote: "Curia helped us create meaningful conversations instead of endless Discord scrolling. Our engagement is through the roof!",
    author: "Jordy",
    role: "Community Lead",
    authorAvatar: "/customers/jordy.jpg"
  },
  {
    id: 2,
    name: "LUKSO",
    category: "Blockchain Community",
    image: "/customers/lukso.png",
    description: "Streamlined their governance discussions with Universal Profile integration and sophisticated token-gating for proposal access.",
    quote: "Finally, a platform that understands Web3 governance. Our proposals now get proper discussion instead of getting lost in channels.",
    author: "Feindura",
    role: "DAO Coordinator",
    authorAvatar: "/customers/feindura.jpg"
  },
  {
    id: 3,
    name: "0xSoul",
    category: "Creator Community",
    image: "/customers/0xsoul.png",
    description: "Built a thriving creator economy with NFT-gated access tiers and embedded forums that showcase member portfolios seamlessly.",
    quote: "The embed integration is chef's kiss. Our creators can showcase work and get feedback without leaving our ecosystem.",
    author: "Craig",
    role: "Founder",
    authorAvatar: "/customers/craig.jpg"
  }
];

const tweetTestimonials = [
  {
    id: 1,
    author: "MavJet",
    handle: "@MavJet_",
    avatar: "/customers/MavJet_.jpg",
    content: "Recognition for forum contributors in real time. Love seeing LUKSO building real community tools, not just hype. 🙌\n\nCuria's got serious potential for power-user culture.",
    likes: 23,
    retweets: 4,
    replies: 2,
    timestamp: "2h"
  },
  {
    id: 2,
    author: "Natasha Fawn",
    handle: "@natashalfawn",
    avatar: "/customers/natashalfawn.jpg",
    content: "quality participation and positive contribution now lands you a top spot on the leaderboard👏🏽\n\ngo be great LUKSOfam💪🏽",
    likes: 31,
    retweets: 7,
    replies: 3,
    timestamp: "3h"
  },
  {
    id: 3,
    author: "J JXN",
    handle: "@J_JXN_",
    avatar: "/customers/J_JXN_.jpg",
    content: "Loving the new additions! non stop building !\n\nCheck out the new lukso community forum with token gated access controls -",
    likes: 18,
    retweets: 5,
    replies: 1,
    timestamp: "4h"
  },
  {
    id: 4,
    author: "Anna Elisa",
    handle: "@notannelisa",
    avatar: "/customers/notannelisa.jpg",
    content: "this is really really cool",
    likes: 12,
    retweets: 2,
    replies: 1,
    timestamp: "5h"
  },
  {
    id: 5,
    author: "DeFi Nour",
    handle: "@Defi_Nour",
    avatar: "/customers/Defi_Nour.jpg",
    content: "is tipping first cool implementation of LUKSO's Universal Profiles?\n\nUsers → Profiles → Tipping → On-chain reputations → Social finance loops",
    likes: 45,
    retweets: 9,
    replies: 6,
    timestamp: "8h"
  },
  {
    id: 6,
    author: "Alfredo Asuaje",
    handle: "@Alfredoasuaje",
    avatar: "/customers/Alfredoasuaje.jpg",
    content: "Everyone: \"Crypto is too complicated.\"\n\nMeanwhile on LUKSO: Type username. Click tip. Done\n\nIs this the first time tipping in Web3 feels smoother than Venmo? 👀",
    likes: 52,
    retweets: 11,
    replies: 4,
    timestamp: "8h"
  },
  {
    id: 7,
    author: "MavJet",
    handle: "@MavJet_",
    avatar: "/customers/MavJet_.jpg",
    content: "One click, no wallet pop-ups, no broken UX.\nwhen Wolt integration?🍲\n\nFeels like how tipping should have worked in Web3 all along.💸🫰",
    likes: 38,
    retweets: 8,
    replies: 3,
    timestamp: "8h"
  },
  {
    id: 8,
    author: "RecoveryHaven",
    handle: "@RecoveryhavenX",
    avatar: "/customers/RecoveryhavenX.jpg",
    content: "Love seeing this drop. Tipping's a game changer for community-driven healing too. We're building around this kind of vision — peer support, decentralized, human-first.",
    likes: 29,
    retweets: 6,
    replies: 2,
    timestamp: "1d"
  },
  {
    id: 9,
    author: "Ethalorian",
    handle: "@ethalorian",
    avatar: "/customers/ethalorian.jpg",
    content: "Huge thanks to for building an awesome plugin with CURIA — we at @lukso_io truly appreciate it.",
    likes: 34,
    retweets: 7,
    replies: 1,
    timestamp: "2d"
  },
  {
    id: 10,
    author: "InternLukso",
    handle: "@InternLukso",
    avatar: "/customers/InternLukso.jpg",
    content: "Love what you guys are doing, and the integration with Universal Profiles 🆙 and LSPs!\n\nThe Social App for web3 communities is here",
    likes: 41,
    retweets: 9,
    replies: 5,
    timestamp: "2d"
  },
  {
    id: 11,
    author: "RecoveryHaven",
    handle: "@RecoveryhavenX",
    avatar: "/customers/RecoveryhavenX.jpg",
    content: "🔥 This is exactly what we've been looking for in our recovery network build. We're exploring partner-friendly tools to unify our outreach and education. 🙌",
    likes: 22,
    retweets: 4,
    replies: 2,
    timestamp: "2d"
  },
  {
    id: 12,
    author: "Zen CFT",
    handle: "@Zen_CFT",
    avatar: "/customers/Zen_CFT.jpg",
    content: "The integration of Universal Profiles with community-driven platforms marks a significant step towards decentralized social interaction. Looking forward to seeing how this shapes digital identity and engagement.",
    likes: 37,
    retweets: 8,
    replies: 3,
    timestamp: "2d"
  },
  {
    id: 13,
    author: "Alts Anonymous",
    handle: "@Alts_Anonymous",
    avatar: "/customers/Alts_Anonymous.jpg",
    content: "Such a great idea to do reddit style upvotes for the upcoming @lukso_io AMA questions 👌\n\nConnect your $LYX Universal Profile and go comment/vote",
    likes: 26,
    retweets: 5,
    replies: 2,
    timestamp: "3d"
  },
  {
    id: 14,
    author: "Todd Kellgren",
    handle: "@ToddKellgren",
    avatar: "/customers/ToddKellgren.jpg",
    content: "Love to see it 👏 I expect a lot of places will require a Universal Profile in the future, awesome to have CG blazing the trail",
    likes: 33,
    retweets: 6,
    replies: 4,
    timestamp: "3d"
  }
];

function CommunityCard({ story, index }: { story: typeof communityStories[0], index: number }) {
  const [imageError, setImageError] = useState(false);
  
  return (
    <div className="group relative bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600">
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10">
        {/* Community Image & Badge */}
        <div className="flex items-start gap-4 mb-6">
          <div className="relative">
            {!imageError ? (
              <img 
                src={story.image}
                alt={story.name}
                className="w-16 h-16 rounded-xl object-cover bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 flex items-center justify-center">
                <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            )}
            
          </div>
          
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
              {story.name}
            </h3>
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              {story.category}
            </p>
            
          </div>
        </div>

        {/* Description */}
        <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
          {story.description}
        </p>

        {/* Quote */}
        <blockquote className="border-l-4 border-blue-500 pl-4 mb-6">
          <p className="text-slate-800 dark:text-slate-200 font-medium italic">
            "{story.quote}"
          </p>
          <footer className="mt-3 flex items-center gap-3">
            <img 
              src={story.authorAvatar}
              alt={story.author}
              className="w-8 h-8 rounded-full object-cover"
            />
            <div className="text-sm text-slate-600 dark:text-slate-400">
              <div className="font-medium text-slate-800 dark:text-slate-200">{story.author}</div>
              <div>{story.role}</div>
            </div>
          </footer>
        </blockquote>

        
      </div>
    </div>
  );
}

function TweetCard({ tweet }: { tweet: typeof tweetTestimonials[0] }) {
  const [imageError, setImageError] = useState(false);
  
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-200 border border-slate-200 dark:border-slate-700 h-full flex flex-col">
      {/* Tweet Header */}
      <div className="flex items-center gap-3 mb-4">
        {!imageError ? (
          <img 
            src={tweet.avatar}
            alt={tweet.author}
            className="w-12 h-12 rounded-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold">
            {tweet.author.charAt(0)}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-slate-900 dark:text-white">
              {tweet.author}
            </h4>
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {tweet.handle} · {tweet.timestamp}
          </p>
        </div>
      </div>

      {/* Tweet Content */}
      <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
        {tweet.content}
      </p>
    </div>
  );
}

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [cardsPerView, setCardsPerView] = useState(3);

  // Handle responsive cards per view
  useEffect(() => {
    const updateCardsPerView = () => {
      if (window.innerWidth < 768) {
        setCardsPerView(1);
      } else if (window.innerWidth < 1024) {
        setCardsPerView(2);
      } else {
        setCardsPerView(3);
      }
    };

    updateCardsPerView();
    window.addEventListener('resize', updateCardsPerView);
    return () => window.removeEventListener('resize', updateCardsPerView);
  }, []);

  // Auto-advance carousel
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % tweetTestimonials.length);
    }, 4000);
    
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const nextCard = () => {
    setCurrentIndex((prev) => (prev + 1) % tweetTestimonials.length);
  };

  const prevCard = () => {
    setCurrentIndex((prev) => (prev - 1 + tweetTestimonials.length) % tweetTestimonials.length);
  };

  const getTransformPercentage = () => {
    return (100 / cardsPerView) * currentIndex;
  };

  return (
    <section className="py-16 lg:py-24 bg-slate-50 dark:bg-slate-800/50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-grid-slate-900/[0.04] dark:bg-grid-slate-400/[0.05] bg-[size:20px_20px]" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
            <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm lg:text-base">Success Stories</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4 lg:mb-6 px-4">
            Communities <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Thriving</span> with Curia
          </h2>
          <p className="text-lg lg:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed px-4">
            From small DAOs to large creator communities, see how teams are building engaged Web3 communities with our platform.
          </p>
        </div>

        {/* Community Stories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-16 lg:mb-20">
          {communityStories.map((story, index) => (
            <CommunityCard key={story.id} story={story} index={index} />
          ))}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 lg:gap-4 mb-12 lg:mb-16 px-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent" />
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <MessageSquare className="w-4 h-4 lg:w-5 lg:h-5" />
            <span className="font-medium text-sm lg:text-base whitespace-nowrap">What builders are saying</span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent" />
        </div>

        {/* Tweet Testimonials Carousel */}
        <div className="relative">
          {/* Navigation Buttons - Hidden on mobile */}
          <button
            onClick={() => { prevCard(); setIsAutoPlaying(false); }}
            className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          
          <button
            onClick={() => { nextCard(); setIsAutoPlaying(false); }}
            className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
          >
            <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>

          {/* Carousel Container */}
          <div 
            className="overflow-hidden mx-0 lg:mx-12"
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
          >
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(-${getTransformPercentage()}%)`
              }}
            >
              {tweetTestimonials.map(tweet => (
                <div key={tweet.id} className="flex-shrink-0 w-full md:w-1/2 lg:w-1/3 px-3">
                  <div className="h-64 md:h-72 lg:h-80">
                    <TweetCard tweet={tweet} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-6 lg:mt-8">
            {tweetTestimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => { setCurrentIndex(index); setIsAutoPlaying(false); }}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index === currentIndex 
                    ? 'bg-blue-600 dark:bg-blue-400 w-6 lg:w-8' 
                    : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12 lg:mt-16 px-4">
          <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 px-4 lg:px-6 py-2 lg:py-3 rounded-full font-medium text-sm lg:text-base">
            <Users className="w-4 h-4 lg:w-5 lg:h-5" />
            <span>Join 50+ communities already using Curia</span>
          </div>
        </div>
      </div>
    </section>
  );
} 
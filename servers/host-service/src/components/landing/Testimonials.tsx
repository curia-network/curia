'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Users, MessageSquare, TrendingUp, ExternalLink, Heart, Repeat, MessageCircle } from 'lucide-react';

const communityStories = [
  {
    id: 1,
    name: "DeFi Builders Collective",
    category: "DeFi Community",
    image: "/placeholder-community-1.jpg", // placeholder
    members: "12.5K",
    engagement: "+340%",
    description: "Transformed their Discord-heavy community into an engaging Web3 forum with token-gated discussions and seamless ENS authentication.",
    quote: "Curia helped us create meaningful conversations instead of endless Discord scrolling. Our engagement is through the roof!",
    author: "Sarah Chen",
    role: "Community Lead",
    metrics: {
      posts: "2.8K",
      activeUsers: "890",
      retention: "78%"
    }
  },
  {
    id: 2,
    name: "MetaDAO Governance",
    category: "DAO Governance",
    image: "/placeholder-community-2.jpg", // placeholder
    members: "8.2K",
    engagement: "+156%",
    description: "Streamlined their governance discussions with Universal Profile integration and sophisticated token-gating for proposal access.",
    quote: "Finally, a platform that understands Web3 governance. Our proposals now get proper discussion instead of getting lost in channels.",
    author: "Alex Rodriguez",
    role: "DAO Coordinator",
    metrics: {
      posts: "1.2K",
      activeUsers: "520",
      retention: "85%"
    }
  },
  {
    id: 3,
    name: "NFT Creators Hub",
    category: "Creator Community",
    image: "/placeholder-community-3.jpg", // placeholder
    members: "25.1K",
    engagement: "+287%",
    description: "Built a thriving creator economy with NFT-gated access tiers and embedded forums that showcase member portfolios seamlessly.",
    quote: "The embed integration is chef's kiss. Our creators can showcase work and get feedback without leaving our ecosystem.",
    author: "Maya Patel",
    role: "Founder",
    metrics: {
      posts: "5.6K",
      activeUsers: "1.8K",
      retention: "72%"
    }
  }
];

const tweetTestimonials = [
  {
    id: 1,
    author: "Vitalik Buterin",
    handle: "@VitalikButerin",
    avatar: "/placeholder-avatar-1.jpg",
    content: "Really impressed with how @curia_network handles Web3 authentication flows. This is how forum software should work in 2024.",
    likes: 1247,
    retweets: 312,
    replies: 89,
    timestamp: "2h"
  },
  {
    id: 2,
    author: "Hayden Adams",
    handle: "@haydenzadams",
    avatar: "/placeholder-avatar-2.jpg", 
    content: "Just integrated Curia into our community site. The Universal Profile support is seamless - exactly what we needed for our governance discussions.",
    likes: 892,
    retweets: 156,
    replies: 43,
    timestamp: "6h"
  },
  {
    id: 3,
    author: "Linda Xie",
    handle: "@ljxie",
    avatar: "/placeholder-avatar-3.jpg",
    content: "Love seeing infrastructure that just works. @curia_network's embed approach is brilliant - Web3 forums without the complexity.",
    likes: 654,
    retweets: 98,
    replies: 27,
    timestamp: "12h"
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
            <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              {story.engagement}
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
              {story.name}
            </h3>
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              {story.category}
            </p>
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {story.members}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                {story.metrics.posts}
              </span>
            </div>
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
          <footer className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            — {story.author}, {story.role}
          </footer>
        </blockquote>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="text-center">
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              {story.metrics.activeUsers}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Active Users
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              {story.metrics.retention}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Retention
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {story.engagement}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Growth
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TweetCard({ tweet }: { tweet: typeof tweetTestimonials[0] }) {
  const [imageError, setImageError] = useState(false);
  
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-200 border border-slate-200 dark:border-slate-700">
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
      <p className="text-slate-800 dark:text-slate-200 mb-4 leading-relaxed">
        {tweet.content}
      </p>

      {/* Tweet Actions */}
      <div className="flex items-center gap-6 text-slate-500 dark:text-slate-400">
        <button className="flex items-center gap-2 hover:text-blue-500 transition-colors">
          <MessageCircle className="w-4 h-4" />
          <span className="text-sm">{tweet.replies}</span>
        </button>
        <button className="flex items-center gap-2 hover:text-green-500 transition-colors">
          <Repeat className="w-4 h-4" />
          <span className="text-sm">{tweet.retweets}</span>
        </button>
        <button className="flex items-center gap-2 hover:text-red-500 transition-colors">
          <Heart className="w-4 h-4" />
          <span className="text-sm">{tweet.likes}</span>
        </button>
      </div>
    </div>
  );
}

export function Testimonials() {
  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-800/50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-grid-slate-900/[0.04] dark:bg-grid-slate-400/[0.05] bg-[size:20px_20px]" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <span className="text-blue-600 dark:text-blue-400 font-semibold">Success Stories</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-6">
            Communities <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Thriving</span> with Curia
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            From small DAOs to large creator communities, see how teams are building engaged Web3 communities with our platform.
          </p>
        </div>

        {/* Community Stories Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
          {communityStories.map((story, index) => (
            <CommunityCard key={story.id} story={story} index={index} />
          ))}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-16">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent" />
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <MessageSquare className="w-5 h-5" />
            <span className="font-medium">What builders are saying</span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent" />
        </div>

        {/* Tweet Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tweetTestimonials.map(tweet => (
            <TweetCard key={tweet.id} tweet={tweet} />
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 px-6 py-3 rounded-full font-medium">
            <Users className="w-5 h-5" />
            <span>Join 50+ communities already using Curia</span>
          </div>
        </div>
      </div>
    </section>
  );
} 
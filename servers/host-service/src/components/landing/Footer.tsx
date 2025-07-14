'use client';

import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  Globe, 
  Twitter, 
  Github, 
  MessageSquare,
  ExternalLink,
  Users,
  Shield,
  Zap,
  Heart,
  MessageCircle
} from 'lucide-react'

export function Footer() {
  const { resolvedTheme } = useTheme();
  
  return (
    <footer className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 no-horizontal-scroll">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16 sm:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16">
            
            {/* Company Info */}
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden">
                    <Image 
                      src="/web-app-manifest-512x512.png" 
                      alt="Curia Logo" 
                      width={40} 
                      height={40} 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      Curia
                    </h3>
                  </div>
                </div>
                
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Build engaged Web3 communities with our embeddable forum platform. 
                  ENS authentication, Universal Profile support, token gating, and seamless integration in one script tag.
                </p>
              </div>
              
              {/* Social Links */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide">
                  Connect
                </h4>
                <div className="flex items-center gap-3">
                  <a 
                    href="https://x.com/curia_network" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
                  >
                    <Twitter className="w-4 h-4" />
                  </a>
                  <a 
                    href="https://github.com/curia-network" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
                  >
                    <Github className="w-4 h-4" />
                  </a>
                  <a 
                    href="https://app.cg/c/uria/" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
                  >
                    <Image 
                      src={resolvedTheme === 'dark' ? '/cg_dark.svg' : '/cg_light.svg'} 
                      alt="Common Ground" 
                      width={16} 
                      height={16} 
                      className="w-4 h-4"
                    />
                  </a>
                </div>
              </div>
            </div>
            
            {/* Platform Links */}
            <div className="space-y-6">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide">
                Platform
              </h4>
              <div className="space-y-4">
                <Link 
                  href="/get-started"
                  className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <Zap className="w-4 h-4" />
                  Get Started
                </Link>
                <Link 
                  href="/demo"
                  className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  Live Demo
                </Link>
                <Link 
                  href="/community"
                  className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  Visit Our Community
                </Link>
              </div>
            </div>
            
            {/* Newsletter/Updates */}
            <div className="space-y-6">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide">
                Stay Updated
              </h4>
              <div className="space-y-4">
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  Join our Telegram community for the latest updates on network launch and more.
                </p>
                <Button 
                  onClick={() => window.open('https://t.me/+Es1lVbpmrJZmMjY6', '_blank')}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Join Telegram Community
                </Button>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Get notified about the whitepaper and node launch
                </p>
              </div>
            </div>
            
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-slate-200 dark:border-slate-700 py-8">
          <div className="flex flex-col md:flex-row items-center justify-start gap-6">
            {/* Copyright */}
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <span>© {new Date().getFullYear()} Curia. Built with</span>
              <Heart className="w-4 h-4 text-red-500" />
              <span>for Web3 communities.</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
} 
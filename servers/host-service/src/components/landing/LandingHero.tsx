"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PreviewModal } from "@/components/configurator/PreviewModal"
import { ThemeToggle, useTheme } from "@/contexts/ThemeContext"
import { ArrowRight, Zap, Shield, Globe, Play, Menu, X } from "lucide-react"
import Image from "next/image"

export function LandingHero() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const hostUrl = process.env.NEXT_PUBLIC_HOST_SERVICE_URL || 'https://your-host-url.com'
  const { resolvedTheme } = useTheme()
  
  // Navigation functions
  const scrollToFooter = () => {
    const footer = document.querySelector('footer')
    if (footer) {
      footer.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleNavClick = (section: string) => {
    setIsMobileMenuOpen(false) // Close mobile menu
    
    switch (section) {
      case 'demo':
        setIsModalOpen(true)
        break
      case 'community':
        window.location.href = '/community'
        break
      case 'connect':
        scrollToFooter()
        break
      case 'get-started':
        window.location.href = '/get-started'
        break
    }
  }

  // Default configuration for landing page demo - uses current theme
  const defaultConfig = {
    width: '100%',
    height: '100%',
    theme: resolvedTheme as 'light' | 'dark',
    borderRadius: '8px',
    backgroundColor: resolvedTheme === 'dark' ? '#0F172A' : '#FFFFFF'
  }
  
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      {/* Background decoration - contained within viewport */}
      <div className="absolute inset-0 bg-grid-slate-900/[0.04] dark:bg-grid-slate-400/[0.05] bg-[size:20px_20px]" />
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />
      
      <div className="relative">
        {/* Navigation Header */}
        <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Logo/Brand */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg overflow-hidden">
                <Image 
                  src="/web-app-manifest-512x512.png" 
                  alt="Curia Logo" 
                  width={32} 
                  height={32} 
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">Curia</span>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <button
                onClick={() => handleNavClick('get-started')}
                className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium transition-colors duration-200"
              >
                Get Started
              </button>
              <button
                onClick={() => handleNavClick('demo')}
                className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium transition-colors duration-200"
              >
                Live Demo
              </button>
              <button
                onClick={() => handleNavClick('community')}
                className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium transition-colors duration-200"
              >
                Community
              </button>
              <button
                onClick={() => handleNavClick('connect')}
                className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium transition-colors duration-200"
              >
                Connect
              </button>
            </nav>
            
            {/* Mobile Menu Button + Theme Toggle */}
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors duration-200"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
          

        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Hero Content */}
            <div className="space-y-8">
              <div className="flex flex-wrap gap-3">
                <Badge className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
                  <Zap className="w-4 h-4" />
                  Open Beta
                </Badge>
                <Badge className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
                  <Shield className="w-4 h-4" />
                  Open Source
                </Badge>
              </div>
              
              <div className="space-y-6">
                <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Embed{" "}
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Web3 Forums
                  </span>{" "}
                  in Minutes
                </h1>
                
                <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                 Add powerful forum functionality to any website with a single script tag. It's never been easier to build a forum.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="group text-base px-8 py-6 bg-blue-600 hover:bg-blue-700"
                  onClick={() => window.location.href = '/get-started'}
                >
                  Get Started
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="text-base px-8 py-6"
                  onClick={() => setIsModalOpen(true)}
                >
                  <Play className="w-5 h-5 mr-2" />
                  Try Live Demo
                </Button>
              </div>
              
              {/* Key Features */}
              <div className="flex flex-wrap gap-6 pt-4">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Shield className="w-5 h-5 text-green-500" />
                  <span className="font-medium">ENS + UP</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Zap className="w-5 h-5 text-blue-500" />
                  <span className="font-medium">One Script Tag</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Globe className="w-5 h-5 text-indigo-500" />
                  <span className="font-medium">Anywhere</span>
                </div>
              </div>
            </div>
            
            {/* Hero Visual */}
            <div className="relative">
              <Card className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-white/20 shadow-2xl">
                <CardContent className="p-4 sm:p-8">
                  <div className="space-y-4">
                    <div className="text-sm text-slate-500 dark:text-slate-400 font-mono">
                      // Add to any website
                    </div>
                    <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-3 sm:p-4 text-green-400 font-mono text-xs sm:text-sm overflow-x-auto">
                      <div className="whitespace-nowrap min-w-0">{`<div id="my-forum"></div>`}</div>
                      <div className="mt-2 whitespace-nowrap min-w-0">{`<script src="${hostUrl}/embed.js"`}</div>
                      <div className="ml-4 sm:ml-8 whitespace-nowrap min-w-0">{`data-community="my-dao"`}</div>
                      <div className="ml-4 sm:ml-8 whitespace-nowrap min-w-0">{`data-theme="light"`}</div>
                      <div className="ml-4 sm:ml-8 whitespace-nowrap min-w-0">{`async>`}</div>
                      <div className="whitespace-nowrap min-w-0">{`</script>`}</div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="truncate">Ready to deploy • 10KB • Zero dependencies</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Floating elements - properly contained */}
              <div className="absolute -top-2 -right-2 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl opacity-20 animate-pulse"></div>
              <div className="absolute -bottom-2 -left-2 w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl opacity-30 animate-pulse delay-1000"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Full-Screen Mobile Navigation Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Overlay Background */}
          <div className="absolute inset-0 bg-white dark:bg-slate-900" />
          
          {/* Navigation Content */}
          <div className="relative h-full flex flex-col">
            {/* Top Bar with Close Button */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg overflow-hidden">
                  <Image 
                    src="/web-app-manifest-512x512.png" 
                    alt="Curia Logo" 
                    width={32} 
                    height={32} 
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-xl font-bold text-slate-900 dark:text-white">Curia</span>
              </div>
              
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-3 -m-3 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors duration-200"
                aria-label="Close menu"
              >
                <X className="w-7 h-7" />
              </button>
            </div>
            
            {/* Navigation Items - Bauhaus Style */}
            <nav className="flex-1 flex flex-col justify-center px-8 space-y-12">
              <button
                onClick={() => handleNavClick('get-started')}
                className="group text-left"
              >
                <div className="text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2 group-active:scale-95 transition-transform duration-150">
                  GET STARTED
                </div>
                <div className="text-lg text-slate-500 dark:text-slate-400 font-medium">
                  Configure your forum
                </div>
              </button>
              
              <button
                onClick={() => handleNavClick('demo')}
                className="group text-left"
              >
                <div className="text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2 group-active:scale-95 transition-transform duration-150">
                  LIVE DEMO
                </div>
                <div className="text-lg text-slate-500 dark:text-slate-400 font-medium">
                  Test the platform
                </div>
              </button>
              
              <button
                onClick={() => handleNavClick('community')}
                className="group text-left"
              >
                <div className="text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2 group-active:scale-95 transition-transform duration-150">
                  COMMUNITY
                </div>
                <div className="text-lg text-slate-500 dark:text-slate-400 font-medium">
                  Visit our forum
                </div>
              </button>
              
              <button
                onClick={() => handleNavClick('connect')}
                className="group text-left"
              >
                <div className="text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2 group-active:scale-95 transition-transform duration-150">
                  CONNECT
                </div>
                <div className="text-lg text-slate-500 dark:text-slate-400 font-medium">
                  Get in touch
                </div>
              </button>
            </nav>
            
            {/* Bottom Theme Toggle */}
            <div className="p-8 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  APPEARANCE
                </span>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Demo Modal */}
      <PreviewModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        config={defaultConfig}
      />
    </section>
  )
} 
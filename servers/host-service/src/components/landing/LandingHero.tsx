"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PreviewModal } from "@/components/configurator/PreviewModal"
import { ThemeToggle, useTheme } from "@/contexts/ThemeContext"
import { ArrowRight, Zap, Shield, Globe, Play } from "lucide-react"

export function LandingHero() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const hostUrl = process.env.NEXT_PUBLIC_HOST_SERVICE_URL || 'https://your-host-url.com'
  const { resolvedTheme } = useTheme()
  
  // Default configuration for landing page demo - uses current theme
  const defaultConfig = {
    width: '100%',
    height: '100%',
    theme: resolvedTheme as 'light' | 'dark',
    borderRadius: '8px'
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
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">Curia</span>
            </div>
            
            {/* Theme Toggle */}
            <ThemeToggle />
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
                  Think "Stripe for Forums". Add powerful forum functionality to any website with a single script tag. 
                  ENS authentication, Universal Profile support, token gating, and real-time discussions—no backend required.
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
                  <span className="font-medium">ENS + UP Auth</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Zap className="w-5 h-5 text-blue-500" />
                  <span className="font-medium">One Script Tag</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Globe className="w-5 h-5 text-indigo-500" />
                  <span className="font-medium">Works Anywhere</span>
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

      {/* Demo Modal */}
      <PreviewModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        config={defaultConfig}
      />
    </section>
  )
} 
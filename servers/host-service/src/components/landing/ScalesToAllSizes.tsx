"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PreviewModal } from "@/components/configurator/PreviewModal"
import { useTheme } from "@/contexts/ThemeContext"
import { 
  Smartphone, 
  Tablet, 
  Monitor,
  Link,
  LayoutPanelTop,
  Globe,
  ArrowRight,
  Zap,
  Palette,
  Users
} from "lucide-react"

export function ScalesToAllSizes() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { resolvedTheme } = useTheme()

  // Default configuration for modal demo
  const defaultConfig = {
    width: '100%',
    height: '100%',
    theme: resolvedTheme as 'light' | 'dark',
    borderRadius: '8px',
    backgroundColor: resolvedTheme === 'dark' ? '#0F172A' : '#FFFFFF'
  }

  return (
    <section className="py-20 sm:py-32 bg-white dark:bg-slate-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-grid-slate-900/[0.04] dark:bg-grid-slate-400/[0.05] bg-[size:20px_20px]" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-20">
          <Badge className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800 mb-6">
            <Zap className="w-4 h-4" />
            Platform Flexibility
          </Badge>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-6">
            Scales to{" "}
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Every Experience
            </span>
          </h2>
          
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Whether you need a simple comment widget or a full Discourse alternative, 
            Curia adapts to your needs without compromise.
          </p>
        </div>

        {/* Device Showcase */}
        <div className="mb-20">
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12 max-w-6xl mx-auto">
            
            {/* Phone - Embed Mode */}
            <div className="text-center space-y-6">
              <div className="relative mx-auto w-32 h-56 bg-slate-900 dark:bg-slate-700 rounded-[2rem] p-2 shadow-xl">
                {/* Phone frame */}
                <div className="w-full h-full bg-white dark:bg-slate-100 rounded-[1.5rem] overflow-hidden relative">
                  {/* Status bar */}
                  <div className="h-6 bg-slate-50 dark:bg-slate-200 flex items-center justify-center">
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                      <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                      <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                    </div>
                  </div>
                  
                  {/* Website content mockup */}
                  <div className="p-2 space-y-2 text-left">
                    <div className="h-2 bg-slate-300 rounded w-3/4"></div>
                    <div className="h-1 bg-slate-200 rounded w-full"></div>
                    <div className="h-1 bg-slate-200 rounded w-2/3"></div>
                    
                    {/* Embedded forum preview */}
                    <div className="bg-blue-50 border border-blue-200 rounded p-1 mt-2">
                      <div className="h-1 bg-blue-300 rounded w-full mb-1"></div>
                      <div className="h-1 bg-blue-200 rounded w-4/5"></div>
                    </div>
                    
                    <div className="h-1 bg-slate-200 rounded w-1/2"></div>
                  </div>
                </div>
                
                {/* Home indicator */}
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-slate-700 dark:bg-slate-500 rounded-full"></div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center justify-center gap-2 mb-2">
                  <Smartphone className="w-5 h-5 text-purple-600" />
                  Mobile Embed
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Seamlessly integrated within your existing mobile website
                </p>
              </div>
            </div>

            {/* Tablet - Integrated Mode */}
            <div className="text-center space-y-6">
              <div className="relative mx-auto w-40 h-56 bg-slate-900 dark:bg-slate-700 rounded-xl p-2 shadow-xl">
                {/* Tablet frame */}
                <div className="w-full h-full bg-white dark:bg-slate-100 rounded-lg overflow-hidden">
                  {/* Dashboard header */}
                  <div className="h-6 bg-slate-100 dark:bg-slate-200 flex items-center px-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-1 bg-slate-400 rounded"></div>
                      <div className="w-3 h-1 bg-slate-300 rounded"></div>
                    </div>
                  </div>
                  
                  {/* Dashboard layout */}
                  <div className="p-2 grid grid-cols-4 gap-1 h-full">
                    {/* Sidebar */}
                    <div className="col-span-1 space-y-1">
                      <div className="h-1 bg-slate-300 rounded"></div>
                      <div className="h-1 bg-slate-200 rounded"></div>
                      <div className="h-1 bg-slate-200 rounded"></div>
                    </div>
                    
                    {/* Main content area with forum */}
                    <div className="col-span-3 space-y-1">
                      <div className="h-1 bg-slate-300 rounded w-1/2"></div>
                      
                      {/* Integrated forum area */}
                      <div className="bg-blue-50 border border-blue-200 rounded p-1 space-y-1">
                        <div className="h-1 bg-blue-400 rounded w-full"></div>
                        <div className="h-1 bg-blue-300 rounded w-4/5"></div>
                        <div className="h-1 bg-blue-200 rounded w-3/5"></div>
                        <div className="h-1 bg-blue-200 rounded w-4/5"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center justify-center gap-2 mb-2">
                  <Tablet className="w-5 h-5 text-blue-600" />
                  Dashboard Integration
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Perfect for admin panels and custom layouts
                </p>
              </div>
            </div>

            {/* Desktop - Full-Screen Mode */}
            <div className="text-center space-y-6">
              <div className="relative mx-auto w-48 h-56 bg-slate-900 dark:bg-slate-700 rounded-lg p-2 shadow-xl">
                {/* Desktop frame */}
                <div className="w-full h-full bg-white dark:bg-slate-100 rounded overflow-hidden">
                  {/* Browser chrome */}
                  <div className="h-4 bg-slate-100 dark:bg-slate-200 flex items-center px-1">
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-red-400 rounded-full"></div>
                      <div className="w-1 h-1 bg-yellow-400 rounded-full"></div>
                      <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                    </div>
                    <div className="ml-2 flex-1 h-1 bg-slate-300 rounded"></div>
                  </div>
                  
                  {/* Full-screen community interface */}
                  <div className="p-2 h-full space-y-1">
                    {/* Navigation */}
                    <div className="flex justify-between items-center">
                      <div className="h-1 bg-blue-500 rounded w-1/4"></div>
                      <div className="h-1 bg-slate-300 rounded w-1/6"></div>
                    </div>
                    
                    {/* Main community content */}
                    <div className="grid grid-cols-4 gap-1 h-full">
                      {/* Sidebar */}
                      <div className="space-y-1">
                        <div className="h-1 bg-slate-400 rounded"></div>
                        <div className="h-1 bg-slate-300 rounded"></div>
                        <div className="h-1 bg-slate-300 rounded"></div>
                        <div className="h-1 bg-slate-200 rounded"></div>
                      </div>
                      
                      {/* Posts feed */}
                      <div className="col-span-3 space-y-1">
                        <div className="bg-blue-50 border border-blue-200 rounded p-1 space-y-1">
                          <div className="h-1 bg-blue-500 rounded w-full"></div>
                          <div className="h-1 bg-blue-300 rounded w-4/5"></div>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded p-1 space-y-1">
                          <div className="h-1 bg-slate-400 rounded w-3/4"></div>
                          <div className="h-1 bg-slate-300 rounded w-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center justify-center gap-2 mb-2">
                  <Monitor className="w-5 h-5 text-green-600" />
                  Full-Screen Platform
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Complete community platform, white-label ready
                </p>
              </div>
            </div>
          </div>
          
          {/* Scale caption */}
          <div className="text-center mt-8">
            <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
              🎯 Responsive Excellence Across All Devices
            </p>
          </div>
        </div>

        {/* Deployment Options */}
        <div className="grid md:grid-cols-2 gap-8 mb-16 max-w-4xl mx-auto">
          
          {/* Embed Mode */}
          <div className="text-center space-y-4 p-6 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
            <div className="w-12 h-12 mx-auto bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
              <Link className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Embed Mode
            </h3>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>• Add to existing websites</li>
              <li>• Preserve your brand</li>
              <li>• 5-minute setup</li>
              <li>• Zero backend changes</li>
            </ul>
          </div>

          {/* Full-Screen Mode */}
          <div className="text-center space-y-4 p-6 rounded-2xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
            <div className="w-12 h-12 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <Globe className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Full-Screen Platform
            </h3>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>• Standalone community</li>
              <li>• White-label ready</li>
              <li>• Discourse alternative</li>
              <li>• Complete control</li>
            </ul>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400 mb-8 text-lg">
            Ready to see the flexibility in action?
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              onClick={() => setIsModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <Palette className="w-5 h-5 mr-2" />
              View Embed Demo
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/demo'}
              className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-6 py-3 rounded-lg transition-all duration-200"
            >
              <Monitor className="w-5 h-5 mr-2" />
              See Full-Screen Platform
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/get-started'}
              className="border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white px-6 py-3 rounded-lg transition-all duration-200"
            >
              Get Started
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
          
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
            ✨ Same powerful platform, infinite deployment possibilities
          </p>
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
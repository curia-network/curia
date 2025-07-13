import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Globe, 
  Twitter, 
  Github, 
  Mail, 
  MessageSquare,
  ExternalLink,
  Users,
  Shield,
  Zap,
  Heart
} from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16 sm:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16">
            
            {/* Company Info */}
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      Curia
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Web3 Forum Platform
                    </p>
                  </div>
                </div>
                
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Build engaged Web3 communities with our embeddable forum platform. 
                  Blockchain authentication, token gating, and seamless integration in one script tag.
                </p>
              </div>
              
              {/* Social Links */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide">
                  Connect
                </h4>
                <div className="flex items-center gap-3">
                  <a 
                    href="#" 
                    className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
                  >
                    <Twitter className="w-4 h-4" />
                  </a>
                  <a 
                    href="#" 
                    className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
                  >
                    <Github className="w-4 h-4" />
                  </a>
                  <a 
                    href="#" 
                    className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
            
            {/* Product Links */}
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
                  href="#"
                  className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  Documentation
                </Link>
                <Link 
                  href="#"
                  className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <Users className="w-4 h-4" />
                  Community
                </Link>
              </div>
            </div>
            
            {/* Resources */}
            <div className="space-y-6">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide">
                Resources
              </h4>
              <div className="space-y-4">
                <Link 
                  href="#"
                  className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  API Reference
                  <ExternalLink className="w-3 h-3" />
                </Link>
                <Link 
                  href="#"
                  className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Integration Guide
                  <ExternalLink className="w-3 h-3" />
                </Link>
                <Link 
                  href="#"
                  className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Web3 Best Practices
                  <ExternalLink className="w-3 h-3" />
                </Link>
                <Link 
                  href="#"
                  className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Help Center
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
            
            {/* Newsletter */}
            <div className="space-y-6">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide">
                Stay Updated
              </h4>
              <div className="space-y-4">
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  Get the latest updates on Web3 community features, integration guides, and platform news.
                </p>
                <div className="space-y-3">
                  <Input 
                    type="email" 
                    placeholder="Enter your email"
                    className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400"
                  />
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    Subscribe
                  </Button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No spam, unsubscribe at any time.
                </p>
              </div>
            </div>
            
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-slate-200 dark:border-slate-700 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            
            {/* Legal Links */}
            <div className="flex items-center gap-6 text-sm">
              <Link 
                href="#"
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>
              <Link 
                href="#"
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Terms of Service
              </Link>
              <Link 
                href="#"
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Cookie Policy
              </Link>
            </div>
            
            {/* Copyright */}
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <span>© 2024 Curia. Built with</span>
              <Heart className="w-4 h-4 text-red-500" />
              <span>for Web3 communities.</span>
            </div>
            
          </div>
        </div>
      </div>
    </footer>
  )
} 
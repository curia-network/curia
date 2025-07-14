'use client';

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Network, 
  Globe, 
  Share2, 
  Database, 
  Zap,
  ArrowRight,
  FileText,
  Users,
  Lock,
  MessageCircle
} from 'lucide-react'
import Image from 'next/image'

export function UpcomingSection() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-slate-50 dark:bg-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-0">
            <Zap className="w-3 h-3 mr-1" />
            Coming Soon
          </Badge>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-6">
            Run a <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Curia Node</span>
          </h2>
          
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Soon, Curia will launch a <strong>federated network of hubs</strong> that anyone can join by running a node. 
            Create your own ecosystem of communities with full data sovereignty.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-16">
          
                     {/* Left: Stack Visualization */}
           <div className="relative flex items-center justify-center">
             <Image
               src="/stack.png"
               alt="Federated Network Stack"
               width={400}
               height={300}
               className="w-full max-w-md object-contain"
             />
           </div>

          {/* Right: Feature Details */}
          <div className="space-y-8">
            <div className="space-y-6">
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    Your Data, Your Node
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Every node is an ecosystem of communities with data stored locally. 
                    Full sovereignty over your community data and infrastructure.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    Cross-Hub Partnerships
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Communities can partner to share content, locks, and feeds across hubs 
                    via our decentralized sync protocol.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    Shared Governance Infrastructure
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Leverage gating locks and governance systems across the entire network 
                    while maintaining local control.
                  </p>
                </div>
              </div>

            </div>

                         {/* CTA */}
             <div className="pt-4">
               <Button 
                 onClick={() => window.open('https://t.me/+Es1lVbpmrJZmMjY6', '_blank')}
                 className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                 size="lg"
               >
                 <MessageCircle className="w-4 h-4 mr-2" />
                 Join Telegram Community
                 <ArrowRight className="w-4 h-4 ml-2" />
               </Button>
               
               <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">
                 Follow updates on the federated network and whitepaper
               </p>
             </div>
          </div>

        </div>

        {/* Bottom Banner */}
        <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Network className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <h3 className="text-xl font-semibold text-purple-900 dark:text-purple-100">
                The Future of Web3 Communities
              </h3>
            </div>
            <p className="text-purple-700 dark:text-purple-300 max-w-2xl mx-auto">
              Imagine a world where every community owns their data, yet can seamlessly collaborate 
              across a decentralized network. That's the Curia federated future we're building.
            </p>
          </CardContent>
        </Card>

      </div>
    </section>
  )
} 
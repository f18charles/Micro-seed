import React from "react";
import { motion } from "motion/react";
import { ArrowRight, ShieldCheck, Zap, Globe } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";

interface LandingPageProps {
  onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden bg-white">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-[0.03] pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:40px_40px]" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge variant="secondary" className="mb-4 px-4 py-1 text-sm font-medium bg-blue-50 text-blue-700 border-blue-100">
                Empowering Emerging Markets
              </Badge>
              <h1 className="text-5xl lg:text-7xl font-black tracking-tight text-neutral-900 leading-[1.1]">
                Capital for the <span className="text-primary">Next Billion</span> Businesses
              </h1>
              <p className="mt-6 text-xl text-neutral-600 leading-relaxed">
                MicroSeed uses AI to assess business potential beyond credit scores. 
                Get the capital you need to grow your small business in minutes.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button size="lg" className="text-lg h-14 px-8 rounded-full shadow-xl shadow-primary/20" onClick={onStart}>
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg h-14 px-8 rounded-full">
                How it Works
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-neutral-50 border-y">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-primary">10k+</p>
              <p className="text-sm text-neutral-500 uppercase tracking-wider">Businesses Funded</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">$5M+</p>
              <p className="text-sm text-neutral-500 uppercase tracking-wider">Capital Disbursed</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">95%</p>
              <p className="text-sm text-neutral-500 uppercase tracking-wider">Repayment Rate</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">24h</p>
              <p className="text-sm text-neutral-500 uppercase tracking-wider">Avg. Approval Time</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              Why Choose MicroSeed?
            </h2>
            <p className="mt-4 text-lg text-neutral-600">
              We're rebuilding finance for the informal economy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Zap className="h-6 w-6 text-amber-500" />}
              title="AI Potential Score"
              description="Our proprietary AI analyzes your business model, location, and goals to see the potential that banks miss."
            />
            <FeatureCard 
              icon={<ShieldCheck className="h-6 w-6 text-green-500" />}
              title="No Collateral Needed"
              description="We believe in your business. Most of our microloans require zero physical collateral to get started."
            />
            <FeatureCard 
              icon={<Globe className="h-6 w-6 text-blue-500" />}
              title="Local & Global"
              description="Supporting multiple currencies and local payment methods across Africa and Southeast Asia."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <Card className="border-none shadow-none hover:bg-neutral-50 transition-colors p-6">
      <CardContent className="p-0 space-y-4">
        <div className="bg-white w-12 h-12 rounded-2xl shadow-sm flex items-center justify-center border">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-neutral-900">{title}</h3>
        <p className="text-neutral-600 leading-relaxed">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

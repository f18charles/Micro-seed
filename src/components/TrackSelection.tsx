import React from 'react';
import { motion } from 'motion/react';
import { Building2, Rocket, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ApplicationTrack } from '../types';

interface TrackSelectionProps {
  onSelect: (track: ApplicationTrack) => void;
}

export const TrackSelection: React.FC<TrackSelectionProps> = ({ onSelect }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-12 space-y-4">
        <h1 className="text-4xl font-black text-neutral-900 tracking-tight uppercase">Choose Your Path</h1>
        <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
          Whether you're growing an established business or launching a new idea, we have a specialized loan track for you.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Existing Business Track */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="h-full flex flex-col border-2 hover:border-primary/50 transition-all duration-300 group shadow-lg hover:shadow-xl">
            <CardHeader className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Existing Business</CardTitle>
                <CardDescription className="text-base mt-2">
                  My business is already operating. I want a loan to grow, buy stock, or expand.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-6">
              <div className="space-y-3">
                <p className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Requirements</p>
                <ul className="space-y-2">
                  {[
                    'Financial statements (3-6 months)',
                    'Business permit or registration',
                    'Revenue & expense history',
                    'Verified business location'
                  ].map((req, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-neutral-700">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
              <Button 
                onClick={() => onSelect('existing')}
                className="w-full h-12 text-lg font-bold group"
              >
                Continue as Existing Business
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Startup Track */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="h-full flex flex-col border-2 border-dashed hover:border-primary/50 transition-all duration-300 group shadow-lg hover:shadow-xl bg-neutral-50/50">
            <CardHeader className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Rocket className="w-8 h-8 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Start a Business</CardTitle>
                <CardDescription className="text-base mt-2">
                  I have a business idea and need funding to get started.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-6">
              <div className="space-y-3">
                <p className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Requirements</p>
                <ul className="space-y-2">
                  {[
                    'Detailed Business Plan',
                    'Personal financial history',
                    'Relevant skills or experience',
                    'Guarantors willing to back you'
                  ].map((req, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-neutral-700">
                      <CheckCircle2 className="w-4 h-4 text-orange-500 flex-shrink-0" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                <p className="text-xs text-orange-800 leading-relaxed font-medium">
                  <strong>Note:</strong> Startup loans are typically smaller. Strong repayment builds your credit profile for larger future loans.
                </p>
              </div>
              <Button 
                onClick={() => onSelect('startup')}
                variant="outline"
                className="w-full h-12 text-lg font-bold border-orange-200 text-orange-700 hover:bg-orange-50 group"
              >
                Continue as Startup Applicant
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

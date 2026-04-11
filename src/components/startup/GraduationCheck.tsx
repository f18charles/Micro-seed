import React from 'react';
import { motion } from 'motion/react';
import { 
  PartyPopper, 
  TrendingUp, 
  ArrowRight, 
  CheckCircle2, 
  Award,
  CreditCard,
  Building2
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { GraduationRecord, Currency } from '../../types';
import { CURRENCY_CONFIG } from '../../lib/currency';

interface GraduationCheckProps {
  record: GraduationRecord;
  currency: Currency;
  onApply: () => void;
}

export const GraduationCheck: React.FC<GraduationCheckProps> = ({ record, currency, onApply }) => {
  const currencySymbol = CURRENCY_CONFIG[currency].symbol;

  if (!record.eligibleForGraduation) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto"
    >
      <Card className="border-none shadow-2xl shadow-primary/20 overflow-hidden bg-gradient-to-br from-primary to-blue-700 text-white">
        <CardContent className="p-0">
          <div className="p-8 space-y-8">
            <div className="flex justify-between items-start">
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                <PartyPopper className="w-8 h-8 text-white" />
              </div>
              <div className="text-right">
                <p className="text-xs font-black uppercase tracking-widest text-white/60">Repayment Score</p>
                <p className="text-4xl font-black">{record.repaymentScore}/100</p>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-tight uppercase">You've Graduated!</h2>
              <p className="text-lg text-white/80 font-medium leading-relaxed">
                Congratulations! You've successfully repaid your startup loan. Based on your excellent repayment history, you're now eligible for a larger business loan.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Max Graduation Loan</p>
                <p className="text-2xl font-black">{currencySymbol}{record.graduationLoanMaxAmount.toLocaleString()}</p>
              </div>
              <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">On-time Payments</p>
                <p className="text-2xl font-black">{record.repaymentsOnTime} / {record.repaymentsTotal}</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-black uppercase tracking-widest text-white/60">Your Graduation Benefits</p>
              <div className="grid grid-cols-1 gap-2">
                {[
                  'Access to 3x higher loan limits',
                  'Lower interest rates for established businesses',
                  'Longer repayment terms (up to 24 months)',
                  'Priority processing for all future applications'
                ].map((benefit, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm font-bold">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    {benefit}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-8 bg-white/10 backdrop-blur-md border-t border-white/10">
            <Button 
              onClick={onApply}
              className="w-full h-14 bg-white text-primary hover:bg-neutral-100 text-lg font-black uppercase tracking-widest group"
            >
              Apply for Business Loan
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <p className="text-center mt-4 text-xs font-bold text-white/60">
              This will transition your profile to the "Existing Business" track.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

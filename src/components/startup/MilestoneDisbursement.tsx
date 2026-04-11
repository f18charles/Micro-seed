import React from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle, 
  Upload, 
  ChevronRight,
  Lock,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { DisbursementMilestone, Currency } from '../../types';
import { CURRENCY_CONFIG } from '../../lib/currency';

interface MilestoneDisbursementProps {
  milestones: DisbursementMilestone[];
  currency: Currency;
  onUploadEvidence: (milestoneNumber: number) => void;
  isProcessing?: boolean;
}

export const MilestoneDisbursement: React.FC<MilestoneDisbursementProps> = ({ 
  milestones, 
  currency,
  onUploadEvidence,
  isProcessing 
}) => {
  const currencySymbol = CURRENCY_CONFIG[currency].symbol;

  const getStatusIcon = (status: DisbursementMilestone['status']) => {
    switch (status) {
      case 'disbursed':
        return <CheckCircle2 className="w-6 h-6 text-green-500" />;
      case 'verified':
        return <ShieldCheck className="w-6 h-6 text-blue-500" />;
      case 'evidence_submitted':
        return <Clock className="w-6 h-6 text-orange-500" />;
      case 'pending':
        return <Circle className="w-6 h-6 text-neutral-300" />;
      case 'missed':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Lock className="w-6 h-6 text-neutral-300" />;
    }
  };

  const getStatusBadge = (status: DisbursementMilestone['status']) => {
    switch (status) {
      case 'disbursed':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Disbursed</Badge>;
      case 'verified':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">Verified</Badge>;
      case 'evidence_submitted':
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none">Awaiting Review</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-neutral-500 border-neutral-200">Pending</Badge>;
      case 'missed':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none">Missed Deadline</Badge>;
      default:
        return null;
    }
  };

  // Find the current active milestone (first one that isn't disbursed or verified)
  const activeMilestoneIndex = milestones.findIndex(m => m.status === 'pending' || m.status === 'evidence_submitted' || m.status === 'missed');

  return (
    <Card className="border-none shadow-xl shadow-neutral-200/50">
      <CardHeader className="border-b bg-neutral-50/50">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-primary/10 p-2 rounded-lg">
            <TrendingUpIcon className="w-5 h-5 text-primary" />
          </div>
          <CardTitle className="text-xl font-black uppercase tracking-tight">Loan Disbursement Tracker</CardTitle>
        </div>
        <CardDescription className="font-medium">
          Your startup loan is released in tranches as you achieve your business milestones.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8">
        <div className="space-y-0">
          {milestones.map((milestone, index) => {
            const isLocked = index > activeMilestoneIndex && activeMilestoneIndex !== -1;
            const isActive = index === activeMilestoneIndex;
            const isCompleted = milestone.status === 'disbursed';

            return (
              <div key={milestone.milestoneNumber} className="relative flex gap-6 pb-10 last:pb-0">
                {/* Connector Line */}
                {index < milestones.length - 1 && (
                  <div className={`absolute left-3 top-8 bottom-0 w-0.5 ${isCompleted ? 'bg-green-200' : 'bg-neutral-100'}`} />
                )}

                {/* Status Icon */}
                <div className="relative z-10 bg-white rounded-full">
                  {isLocked ? <Lock className="w-6 h-6 text-neutral-200" /> : getStatusIcon(milestone.status)}
                </div>

                {/* Content */}
                <div className={`flex-grow space-y-3 ${isLocked ? 'opacity-50' : ''}`}>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="font-black text-lg text-neutral-900">
                        Milestone {milestone.milestoneNumber}: {currencySymbol}{milestone.amount.toLocaleString()}
                      </h4>
                      <p className="text-sm font-medium text-neutral-600 leading-relaxed max-w-md">
                        {milestone.description}
                      </p>
                    </div>
                    {getStatusBadge(milestone.status)}
                  </div>

                  {!isLocked && milestone.status !== 'disbursed' && (
                    <div className="p-4 bg-neutral-50 rounded-xl border-2 border-neutral-100 space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-white p-2 rounded-lg border shadow-sm">
                          <FileText className="w-4 h-4 text-neutral-500" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-black uppercase tracking-widest text-neutral-400">Required Evidence</p>
                          <p className="text-sm font-bold text-neutral-700">{milestone.triggerCondition}</p>
                        </div>
                      </div>

                      {isActive && milestone.status === 'pending' && (
                        <Button 
                          onClick={() => onUploadEvidence(milestone.milestoneNumber)}
                          disabled={isProcessing}
                          className="w-full h-11 font-bold group"
                        >
                          <Upload className="w-4 h-4 mr-2 group-hover:-translate-y-0.5 transition-transform" />
                          Upload Evidence
                        </Button>
                      )}

                      {milestone.status === 'evidence_submitted' && (
                        <div className="flex items-center gap-2 text-orange-600 bg-orange-50 p-3 rounded-lg border border-orange-100">
                          <Clock className="w-4 h-4" />
                          <span className="text-xs font-bold">Evidence submitted. Awaiting admin verification.</span>
                        </div>
                      )}
                    </div>
                  )}

                  {milestone.status === 'disbursed' && milestone.disbursedAt && (
                    <div className="flex items-center gap-2 text-green-600 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      Disbursed on {new Date(milestone.disbursedAt.toString()).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

// Helper component for the header icon
const TrendingUpIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

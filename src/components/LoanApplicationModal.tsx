import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { formatCurrency } from "../lib/currency";
import { Currency } from "../types";
import { AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";

interface LoanApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (amount: number) => void;
  maxAmount: number;
  currency: Currency;
}

export default function LoanApplicationModal({ isOpen, onClose, onApply, maxAmount, currency }: LoanApplicationModalProps) {
  const [amount, setAmount] = useState(Math.min(maxAmount, 1000));

  const handleApply = () => {
    onApply(amount);
    onClose();
  };

  const isInvalid = amount < 100 || amount > maxAmount;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Apply for Microloan</DialogTitle>
          <DialogDescription>
            Choose the amount you need. You are eligible for up to {formatCurrency(maxAmount, currency)}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-6">
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <Label htmlFor="amount" className="text-sm font-bold text-neutral-500 uppercase">Loan Amount</Label>
              <span className="text-2xl font-black text-primary">{formatCurrency(amount, currency)}</span>
            </div>
            
            <Input 
              id="amount" 
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(Number(e.target.value))}
              onBlur={() => {
                if (amount < 100) setAmount(100);
                if (amount > maxAmount) setAmount(maxAmount);
              }}
              className="text-lg font-bold h-12"
            />
            
            <div className="pt-4">
              <Slider 
                value={[amount]} 
                onValueChange={(val) => setAmount(val[0])} 
                max={maxAmount} 
                min={100} 
                step={100}
                className="cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-neutral-400 mt-2 font-bold uppercase">
                <span>Min: {formatCurrency(100, currency)}</span>
                <span>Max: {formatCurrency(maxAmount, currency)}</span>
              </div>
            </div>
          </div>

          <Alert className="bg-blue-50 border-blue-100 text-blue-800">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-xs">
              This loan has a 12-month repayment term. Your interest rate is fixed based on your assessment.
            </AlertDescription>
          </Alert>

          {isInvalid && (
            <div className="flex items-center gap-2 text-destructive text-xs font-medium">
              <AlertCircle className="h-4 w-4" />
              Amount must be between {formatCurrency(100, currency)} and {formatCurrency(maxAmount, currency)}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleApply} disabled={isInvalid} className="px-8">
            Submit Application
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

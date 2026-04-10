import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { CheckCircle2 } from "lucide-react";

interface LoanApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  maxAmount: number;
  onConfirm: (amount: number) => void;
}

export default function LoanApplicationModal({ isOpen, onClose, maxAmount, onConfirm }: LoanApplicationModalProps) {
  const [amount, setAmount] = useState(maxAmount);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleConfirm = () => {
    onConfirm(amount);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 animate-bounce" />
            <div className="text-center">
              <h3 className="text-xl font-bold">Application Submitted!</h3>
              <p className="text-neutral-500">We'll review your request and get back to you soon.</p>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Apply for Microloan</DialogTitle>
              <DialogDescription>
                Based on your business assessment, you are eligible for up to ${maxAmount.toLocaleString()}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Loan Amount ($)</Label>
                <Input 
                  id="amount" 
                  type="number" 
                  value={amount} 
                  onChange={(e) => setAmount(Number(e.target.value))}
                  max={maxAmount}
                  min={100}
                />
                <p className="text-xs text-neutral-500">Min: $100 | Max: ${maxAmount.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-neutral-50 rounded-lg text-sm space-y-2">
                <div className="flex justify-between">
                  <span>Interest Rate</span>
                  <span className="font-semibold">12% APR</span>
                </div>
                <div className="flex justify-between">
                  <span>Term</span>
                  <span className="font-semibold">12 Months</span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span>Est. Monthly Payment</span>
                  <span className="font-bold text-primary">${((amount * 1.12) / 12).toFixed(2)}</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleConfirm} disabled={amount > maxAmount || amount < 100}>
                Confirm Application
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

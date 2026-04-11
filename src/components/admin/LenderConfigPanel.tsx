import React, { useState, useEffect } from 'react';
import { 
  Settings2, 
  ShieldCheck, 
  Percent, 
  Calendar, 
  Wallet, 
  FileCheck, 
  AlertTriangle,
  Save,
  Loader2,
  Info,
  Rocket,
  TrendingUp,
  Award
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { db, auth } from '../../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { LenderConfig, DocumentType } from '../../types';
import { toast } from 'sonner';

const DOCUMENT_TYPES: { label: string; value: DocumentType }[] = [
  { label: 'KRA PIN Certificate', value: 'kra_pin' },
  { label: 'National ID', value: 'national_id' },
  { label: 'Bank Statement', value: 'bank_statement' },
  { label: 'M-PESA Statement', value: 'mpesa_statement' },
  { label: 'Business Permit', value: 'business_permit' },
  { label: 'Tax Compliance', value: 'tax_compliance' },
  { label: 'CR12', value: 'cr12' }
];

export default function LenderConfigPanel() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState<LenderConfig>({
    id: 'lender_config',
    lenderName: 'MicroSeed Capital',
    minLoanAmount: 5000,
    maxLoanAmount: 500000,
    availableTerms: [3, 6, 12],
    defaultTermMonths: 6,
    interestRateModel: 'flat',
    minInterestRate: 5,
    maxInterestRate: 30,
    defaultInterestRate: 15,
    requireGuarantors: true,
    minGuarantors: 1,
    maxGuarantors: 3,
    requireFinancialDocs: true,
    minDocumentMonths: 3,
    acceptableRevenueDeviation: 20,
    requiredDocumentTypes: ['national_id', 'kra_pin', 'mpesa_statement'],
    fraudAutoReject: false,
    allowAppeals: true,
    appealWindowDays: 14,
    disbursementMethod: 'mpesa',
    repaymentsMethods: ['mpesa', 'bank_transfer'],
    startupLoansEnabled: true,
    maxStartupLoanAmount: 100000,
    startupLoanTerms: [3, 6, 12],
    startupMinGuarantors: 2,
    enableMilestoneDisbursement: true,
    enableGraduation: true,
    graduationMinRepaymentScore: 80,
    updatedAt: '',
    updatedBy: ''
  } as any);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const snap = await getDoc(doc(db, 'app_settings', 'lender_config'));
        if (snap.exists()) {
          setConfig(snap.data() as LenderConfig);
        }
      } catch (error) {
        console.error("Failed to fetch lender config:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const admin = auth.currentUser;
      const updatedConfig = {
        ...config,
        updatedAt: serverTimestamp(),
        updatedBy: admin?.uid
      };
      await setDoc(doc(db, 'app_settings', 'lender_config'), updatedConfig);
      toast.success("Lender configuration updated successfully");
    } catch (error: any) {
      toast.error("Failed to save configuration: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Settings2 className="w-6 h-6 text-primary" />
            Lender Configuration
          </h2>
          <p className="text-muted-foreground">Define your lending parameters, risk thresholds, and requirements.</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="h-12 px-8 font-bold shadow-lg shadow-primary/20">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Business Identity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Business Identity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Lender Name</Label>
              <Input 
                value={config.lenderName} 
                onChange={(e) => setConfig(prev => ({ ...prev, lenderName: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Loan Parameters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              Loan Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Loan (KSh)</Label>
                <Input 
                  type="number" 
                  value={config.minLoanAmount} 
                  onChange={(e) => setConfig(prev => ({ ...prev, minLoanAmount: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Loan (KSh)</Label>
                <Input 
                  type="number" 
                  value={config.maxLoanAmount} 
                  onChange={(e) => setConfig(prev => ({ ...prev, maxLoanAmount: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Interest Rate Model</Label>
              <Select 
                value={config.interestRateModel} 
                onValueChange={(v: any) => setConfig(prev => ({ ...prev, interestRateModel: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flat">Flat Rate</SelectItem>
                  <SelectItem value="reducing_balance">Reducing Balance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Min %</Label>
                <Input 
                  type="number" 
                  value={config.minInterestRate} 
                  onChange={(e) => setConfig(prev => ({ ...prev, minInterestRate: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Max %</Label>
                <Input 
                  type="number" 
                  value={config.maxInterestRate} 
                  onChange={(e) => setConfig(prev => ({ ...prev, maxInterestRate: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Default %</Label>
                <Input 
                  type="number" 
                  value={config.defaultInterestRate} 
                  onChange={(e) => setConfig(prev => ({ ...prev, defaultInterestRate: Number(e.target.value) }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requirements */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-primary" />
              Verification Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="font-bold">Guarantors</Label>
                  <Switch 
                    checked={config.requireGuarantors} 
                    onCheckedChange={(v) => setConfig(prev => ({ ...prev, requireGuarantors: v }))}
                  />
                </div>
                {config.requireGuarantors && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Min</Label>
                      <Input 
                        type="number" 
                        value={config.minGuarantors} 
                        onChange={(e) => setConfig(prev => ({ ...prev, minGuarantors: Number(e.target.value) }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Max</Label>
                      <Input 
                        type="number" 
                        value={config.maxGuarantors} 
                        onChange={(e) => setConfig(prev => ({ ...prev, maxGuarantors: Number(e.target.value) }))}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="font-bold">Financial Docs</Label>
                  <Switch 
                    checked={config.requireFinancialDocs} 
                    onCheckedChange={(v) => setConfig(prev => ({ ...prev, requireFinancialDocs: v }))}
                  />
                </div>
                {config.requireFinancialDocs && (
                  <div className="space-y-2">
                    <Label className="text-xs">Min Statement Months</Label>
                    <Select 
                      value={config.minDocumentMonths.toString()} 
                      onValueChange={(v) => setConfig(prev => ({ ...prev, minDocumentMonths: Number(v) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 Months</SelectItem>
                        <SelectItem value="6">6 Months</SelectItem>
                        <SelectItem value="12">12 Months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="font-bold">Appeals</Label>
                  <Switch 
                    checked={config.allowAppeals} 
                    onCheckedChange={(v) => setConfig(prev => ({ ...prev, allowAppeals: v }))}
                  />
                </div>
                {config.allowAppeals && (
                  <div className="space-y-2">
                    <Label className="text-xs">Appeal Window (Days)</Label>
                    <Input 
                      type="number" 
                      value={config.appealWindowDays} 
                      onChange={(e) => setConfig(prev => ({ ...prev, appealWindowDays: Number(e.target.value) }))}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <Label className="font-bold">Required Document Types</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {DOCUMENT_TYPES.map((type) => (
                  <div key={type.value} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`doc-${type.value}`}
                      checked={config.requiredDocumentTypes.includes(type.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setConfig(prev => ({ ...prev, requiredDocumentTypes: [...prev.requiredDocumentTypes, type.value] }));
                        } else {
                          setConfig(prev => ({ ...prev, requiredDocumentTypes: prev.requiredDocumentTypes.filter(t => t !== type.value) }));
                        }
                      }}
                    />
                    <label htmlFor={`doc-${type.value}`} className="text-sm font-medium leading-none cursor-pointer">
                      {type.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fraud Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-primary" />
              Fraud & Risk Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="font-bold">Auto-reject on High Risk</Label>
                <p className="text-xs text-muted-foreground">Reject applications flagged as 'high' or 'critical' risk.</p>
              </div>
              <Switch 
                checked={config.fraudAutoReject} 
                onCheckedChange={(v) => setConfig(prev => ({ ...prev, fraudAutoReject: v }))}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Acceptable Revenue Deviation</Label>
                <span className="text-sm font-bold text-primary">{config.acceptableRevenueDeviation}%</span>
              </div>
              <input 
                type="range" 
                min="5" 
                max="50" 
                step="5"
                value={config.acceptableRevenueDeviation}
                onChange={(e) => setConfig(prev => ({ ...prev, acceptableRevenueDeviation: Number(e.target.value) }))}
                className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <p className="text-[10px] text-muted-foreground">Flag if documented revenue deviates more than this from claimed revenue.</p>
            </div>
          </CardContent>
        </Card>

        {/* Disbursement & Repayment */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Payments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Primary Disbursement Method</Label>
              <Select 
                value={config.disbursementMethod} 
                onValueChange={(v: any) => setConfig(prev => ({ ...prev, disbursementMethod: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mpesa">M-PESA</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Startup Loan Settings */}
        <Card className="md:col-span-2 border-amber-200 bg-amber-50/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-amber-900">
              <Rocket className="w-5 h-5 text-amber-600" />
              Startup Loan Track Settings
            </CardTitle>
            <CardDescription>Configure parameters for applicants without existing businesses.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="font-bold">Enable Startup Loans</Label>
                  <Switch 
                    checked={config.startupLoansEnabled} 
                    onCheckedChange={(v) => setConfig(prev => ({ ...prev, startupLoansEnabled: v }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Startup Amount (KSh)</Label>
                  <Input 
                    type="number" 
                    value={config.maxStartupLoanAmount} 
                    onChange={(e) => setConfig(prev => ({ ...prev, maxStartupLoanAmount: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="font-bold">Milestone Disbursement</Label>
                  <Switch 
                    checked={config.allowMilestoneDisbursement} 
                    onCheckedChange={(v) => setConfig(prev => ({ ...prev, allowMilestoneDisbursement: v }))}
                  />
                </div>
                <p className="text-xs text-muted-foreground italic">
                  If enabled, startup loans will be released in tranches based on verified business milestones.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="font-bold">Enable Graduation</Label>
                  <Switch 
                    checked={config.enableGraduation} 
                    onCheckedChange={(v) => setConfig(prev => ({ ...prev, enableGraduation: v }))}
                  />
                </div>
                {config.enableGraduation && (
                  <div className="space-y-2">
                    <Label className="text-xs">Min Repayment Score for Graduation</Label>
                    <Input 
                      type="number" 
                      value={config.graduationMinRepaymentScore} 
                      onChange={(e) => setConfig(prev => ({ ...prev, graduationMinRepaymentScore: Number(e.target.value) }))}
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0" />
        <p className="text-sm text-blue-800">
          These settings globally affect loan eligibility, scoring penalties, and the application flow for all borrowers.
        </p>
      </div>
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Rocket, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Building2, 
  MapPin, 
  Target, 
  Lightbulb, 
  TrendingUp, 
  Plus, 
  Trash2, 
  DollarSign,
  Briefcase,
  GraduationCap,
  History,
  FileText,
  PieChart as PieChartIcon
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Progress } from '../ui/progress';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Switch } from '../ui/switch';
import { toast } from 'sonner';
import { 
  StartupStage, 
  BusinessIndustry, 
  LoanUsageItem, 
  StartupProfile, 
  PersonalFinancialProfile 
} from '../../types';
import DocumentUpload from '../DocumentUpload';
import { auth } from '../../firebase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

const startupSchema = z.object({
  // Step 1
  businessName: z.string().min(2, "Business name is required"),
  industry: z.string().min(1, "Industry is required"),
  location: z.string().min(2, "Location is required"),
  stage: z.enum(['idea', 'planning', 'pre_launch', 'launchednorevenue']),
  description: z.string().min(50, "Please provide a more detailed description (min 50 chars)"),
  targetMarket: z.string().min(30, "Please describe your target market (min 30 chars)"),
  uniqueValueProposition: z.string().min(30, "Please explain your unique value (min 30 chars)"),
  
  // Step 2
  competitorAnalysis: z.string().min(30, "Please provide competitor analysis"),
  advantage: z.string().min(30, "Please explain your advantage"),
  marketingPlan: z.string().min(30, "Please explain your marketing plan"),
  hasPreOrders: z.boolean(),
  preOrderDetails: z.string().optional(),
  hasLocalCompetitor: z.boolean(),
  localCompetitionStrategy: z.string().optional(),

  // Step 3
  projectedMonthlyRevenue: z.number().min(1000, "Revenue must be at least 1,000"),
  revenueJustification: z.string().min(30, "Please justify your revenue projections"),
  projectedMonthlyExpenses: z.number().min(500),
  expenseBreakdown: z.array(z.object({
    item: z.string().min(1),
    amount: z.number().min(1)
  })).min(1, "At least one expense item is required"),
  breakEvenMonths: z.number().min(1).max(36),
  projectedMonth1: z.number().min(0),
  projectedMonth6: z.number().min(0),

  // Step 4
  requestedAmount: z.number().min(5000, "Minimum loan is 5,000"),
  loanUsageBreakdown: z.array(z.object({
    item: z.string().min(1),
    amount: z.number().min(1),
    category: z.enum(['stock', 'equipment', 'premises', 'marketing', 'working_capital', 'other']),
    isEssential: z.boolean()
  })).min(1, "At least one usage item is required"),

  // Step 5
  relevantExperience: z.string().min(30, "Please describe your experience"),
  hasWorkedInIndustry: z.boolean(),
  yearsExperienceInIndustry: z.number().optional(),
  hasQualification: z.boolean(),
  qualificationDetails: z.string().optional(),
  hasRunBusinessBefore: z.boolean(),
  priorBusinessDetails: z.string().optional(),
  whySuccess: z.string().min(100, "Please provide a more detailed explanation (min 100 chars)"),
  
  // Personal Financial
  employmentStatus: z.enum(['employed', 'self_employed', 'unemployed', 'student', 'other']),
  monthlyIncome: z.number().min(0),
  monthlyExpenses: z.number().min(0),
  hasExistingLoans: z.boolean(),
  monthlyLoanRepayment: z.number().optional(),
  hasSavings: z.boolean(),
  savingsAmount: z.number().optional(),
  mpesaActivity: z.enum(['under_5000', '5000_20000', '20000_50000', 'above_50000']),
});

type StartupFormData = z.infer<typeof startupSchema>;

interface StartupAssessmentFormProps {
  onSubmit: (data: any) => void;
  isLoading: boolean;
  currencySymbol: string;
}

export const StartupAssessmentForm: React.FC<StartupAssessmentFormProps> = ({ onSubmit, isLoading, currencySymbol }) => {
  const [step, setStep] = useState(1);
  const totalSteps = 6;
  const [documents, setDocuments] = useState<Record<string, any>>({});

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<StartupFormData>({
    resolver: zodResolver(startupSchema),
    defaultValues: {
      stage: 'idea',
      hasPreOrders: false,
      hasLocalCompetitor: false,
      expenseBreakdown: [{ item: 'Rent', amount: 0 }],
      loanUsageBreakdown: [{ item: '', amount: 0, category: 'stock', isEssential: true }],
      hasWorkedInIndustry: false,
      hasQualification: false,
      hasRunBusinessBefore: false,
      employmentStatus: 'unemployed',
      hasExistingLoans: false,
      hasSavings: false,
      mpesaActivity: 'under_5000',
      breakEvenMonths: 6,
      projectedMonth1: 0,
      projectedMonth6: 0,
    }
  });

  const { fields: expenseFields, append: appendExpense, remove: removeExpense } = useFieldArray({
    control,
    name: "expenseBreakdown"
  });

  const { fields: usageFields, append: appendUsage, remove: removeUsage } = useFieldArray({
    control,
    name: "loanUsageBreakdown"
  });

  const watchUsage = watch("loanUsageBreakdown");
  const totalAllocated = useMemo(() => watchUsage.reduce((acc, curr) => acc + (curr.amount || 0), 0), [watchUsage]);
  const requestedAmount = watch("requestedAmount") || 0;

  const watchProjections = watch(["projectedMonth1", "projectedMonthlyRevenue", "projectedMonth6"]);
  const chartData = useMemo(() => [
    { name: 'Month 1', value: watchProjections[0] || 0 },
    { name: 'Month 3', value: watchProjections[1] || 0 },
    { name: 'Month 6', value: watchProjections[2] || 0 },
  ], [watchProjections]);

  const usageChartData = useMemo(() => {
    const categories: Record<string, number> = {};
    watchUsage.forEach(u => {
      categories[u.category] = (categories[u.category] || 0) + (u.amount || 0);
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [watchUsage]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  const nextStep = async () => {
    // Basic validation per step could be added here
    if (step < totalSteps) setStep(s => s + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(s => s - 1);
  };

  const handleDocumentUpload = (doc: any) => {
    setDocuments(prev => ({ ...prev, [doc.type]: doc }));
  };

  const handleDocumentDelete = (doc: any) => {
    setDocuments(prev => {
      const next = { ...prev };
      delete next[doc.type];
      return next;
    });
  };

  const onFinalSubmit = (data: StartupFormData) => {
    if (Math.abs(totalAllocated - requestedAmount) > 500) {
      toast.error(`Loan usage total (${currencySymbol}${totalAllocated.toLocaleString()}) must match requested amount (${currencySymbol}${requestedAmount.toLocaleString()})`);
      return;
    }
    onSubmit({ ...data, documents: Object.values(documents) });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-12 space-y-6">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight uppercase text-neutral-900">Startup Application</h1>
            <p className="text-neutral-500 font-medium">Step {step} of {totalSteps}: {
              step === 1 ? "The Business Idea" :
              step === 2 ? "Market & Competition" :
              step === 3 ? "The Numbers" :
              step === 4 ? "Loan Usage Plan" :
              step === 5 ? "Your Background" : "Review & Submit"
            }</p>
          </div>
          <div className="text-right">
            <span className="text-sm font-black text-primary uppercase tracking-widest">{Math.round((step / totalSteps) * 100)}% Complete</span>
          </div>
        </div>
        <Progress value={(step / totalSteps) * 100} className="h-3 rounded-full bg-neutral-100" />
      </div>

      <Card className="border-none shadow-2xl shadow-neutral-200/50 overflow-hidden">
        <form onSubmit={handleSubmit(onFinalSubmit)}>
          <CardContent className="p-0">
            <AnimatePresence mode="wait">
              {/* Step 1: The Business Idea */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-8 space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-bold uppercase tracking-wider text-neutral-500">Business Name</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                        <Input className="pl-10 h-12 border-2 focus:ring-primary" {...register("businessName")} placeholder="e.g. Green Valley Farm" />
                      </div>
                      {errors.businessName && <p className="text-xs text-red-500 font-medium">{errors.businessName.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-bold uppercase tracking-wider text-neutral-500">Industry</Label>
                      <Select onValueChange={(val: BusinessIndustry) => setValue("industry", val)} defaultValue={watch("industry")}>
                        <SelectTrigger className="h-12 border-2">
                          <SelectValue placeholder="Select Industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {['retail', 'food_beverage', 'services', 'manufacturing', 'agriculture', 'technology', 'other'].map(ind => (
                            <SelectItem key={ind} value={ind} className="capitalize">{ind.replace('_', ' & ')}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-sm font-bold uppercase tracking-wider text-neutral-500">Startup Stage</Label>
                    <RadioGroup 
                      onValueChange={(val: StartupStage) => setValue("stage", val)} 
                      defaultValue={watch("stage")}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    >
                      {[
                        { id: 'idea', label: 'Just an idea', desc: "I have a concept but haven't started planning" },
                        { id: 'planning', label: 'Planning stage', desc: "I'm actively researching and preparing" },
                        { id: 'pre_launch', label: 'Ready to launch', desc: "I'm ready but need capital to begin" },
                        { id: 'launchednorevenue', label: 'Just launched', desc: "I've started but have no revenue yet" }
                      ].map(s => (
                        <div key={s.id} className="relative">
                          <RadioGroupItem value={s.id} id={s.id} className="peer sr-only" />
                          <Label
                            htmlFor={s.id}
                            className="flex flex-col p-4 border-2 rounded-xl cursor-pointer hover:bg-neutral-50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all"
                          >
                            <span className="font-bold text-lg">{s.label}</span>
                            <span className="text-xs text-neutral-500 font-medium">{s.desc}</span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-bold uppercase tracking-wider text-neutral-500">Business Description</Label>
                    <Textarea 
                      className="min-h-[120px] border-2 resize-none" 
                      {...register("description")} 
                      placeholder="What exactly will your business do? What products or services will you sell?"
                    />
                    {errors.description && <p className="text-xs text-red-500 font-medium">{errors.description.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-bold uppercase tracking-wider text-neutral-500">Target Market</Label>
                      <Textarea 
                        className="min-h-[100px] border-2 resize-none" 
                        {...register("targetMarket")} 
                        placeholder="Who are your customers? Be specific."
                      />
                      {errors.targetMarket && <p className="text-xs text-red-500 font-medium">{errors.targetMarket.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-bold uppercase tracking-wider text-neutral-500">Unique Value Proposition</Label>
                      <Textarea 
                        className="min-h-[100px] border-2 resize-none" 
                        {...register("uniqueValueProposition")} 
                        placeholder="Why will customers choose YOU over existing options?"
                      />
                      {errors.uniqueValueProposition && <p className="text-xs text-red-500 font-medium">{errors.uniqueValueProposition.message}</p>}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Market & Competition */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-8 space-y-8"
                >
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-bold uppercase tracking-wider text-neutral-500">Competitor Analysis</Label>
                      <Textarea 
                        className="min-h-[100px] border-2 resize-none" 
                        {...register("competitorAnalysis")} 
                        placeholder="Who are your main competitors? Name them specifically."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-bold uppercase tracking-wider text-neutral-500">Your Advantage</Label>
                      <Textarea 
                        className="min-h-[100px] border-2 resize-none" 
                        {...register("advantage")} 
                        placeholder="What is your advantage over them?"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-bold uppercase tracking-wider text-neutral-500">Marketing Plan</Label>
                      <Textarea 
                        className="min-h-[100px] border-2 resize-none" 
                        {...register("marketingPlan")} 
                        placeholder="How will customers find out about your business?"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-6 bg-neutral-50 rounded-2xl border-2 border-neutral-100 space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="font-bold">Pre-orders or LOIs?</Label>
                        <Switch checked={watch("hasPreOrders")} onCheckedChange={(val) => setValue("hasPreOrders", val)} />
                      </div>
                      {watch("hasPreOrders") && (
                        <Textarea 
                          className="bg-white border-2" 
                          {...register("preOrderDetails")} 
                          placeholder="Describe your existing interest/customers"
                        />
                      )}
                    </div>

                    <div className="p-6 bg-neutral-50 rounded-2xl border-2 border-neutral-100 space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="font-bold">Local Competitor Nearby?</Label>
                        <Switch checked={watch("hasLocalCompetitor")} onCheckedChange={(val) => setValue("hasLocalCompetitor", val)} />
                      </div>
                      {watch("hasLocalCompetitor") && (
                        <Textarea 
                          className="bg-white border-2" 
                          {...register("localCompetitionStrategy")} 
                          placeholder="How will you compete with the nearby business?"
                        />
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: The Numbers */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-8 space-y-8"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-bold uppercase tracking-wider text-neutral-500">Projected Month 3 Revenue</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-3 text-neutral-400 font-bold">{currencySymbol}</span>
                            <Input 
                              type="number" 
                              className="pl-10 h-12 border-2" 
                              {...register("projectedMonthlyRevenue", { valueAsNumber: true })} 
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-bold uppercase tracking-wider text-neutral-500">Projected Monthly Expenses</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-3 text-neutral-400 font-bold">{currencySymbol}</span>
                            <Input 
                              type="number" 
                              className="pl-10 h-12 border-2" 
                              {...register("projectedMonthlyExpenses", { valueAsNumber: true })} 
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-bold uppercase tracking-wider text-neutral-500">Revenue Justification</Label>
                        <Textarea 
                          className="min-h-[100px] border-2 resize-none" 
                          {...register("revenueJustification")} 
                          placeholder="How did you arrive at these projections?"
                        />
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-bold uppercase tracking-wider text-neutral-500">Expense Breakdown</Label>
                          <Button type="button" variant="outline" size="sm" onClick={() => appendExpense({ item: '', amount: 0 })}>
                            <Plus className="w-4 h-4 mr-1" /> Add Item
                          </Button>
                        </div>
                        <div className="space-y-3">
                          {expenseFields.map((field, index) => (
                            <div key={field.id} className="flex gap-3 items-start">
                              <Input 
                                className="flex-grow border-2" 
                                {...register(`expenseBreakdown.${index}.item`)} 
                                placeholder="e.g. Rent, Stock"
                              />
                              <div className="relative w-32">
                                <span className="absolute left-2 top-2.5 text-xs text-neutral-400 font-bold">{currencySymbol}</span>
                                <Input 
                                  type="number" 
                                  className="pl-7 border-2" 
                                  {...register(`expenseBreakdown.${index}.amount`, { valueAsNumber: true })} 
                                />
                              </div>
                              <Button type="button" variant="ghost" size="icon" onClick={() => removeExpense(index)} className="text-red-500">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <div className="bg-neutral-50 p-6 rounded-2xl border-2 border-neutral-100">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-500 mb-6 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-primary" />
                          Revenue Ramp-up Projection
                        </h3>
                        <div className="h-[200px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
                              <YAxis hide />
                              <Tooltip 
                                cursor={{ fill: '#f5f5f5' }}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                              />
                              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                {chartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={index === 1 ? '#3b82f6' : '#94a3b8'} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="mt-6 grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Month 1</Label>
                            <Input type="number" className="h-10 border-2" {...register("projectedMonth1", { valueAsNumber: true })} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Month 6</Label>
                            <Input type="number" className="h-10 border-2" {...register("projectedMonth6", { valueAsNumber: true })} />
                          </div>
                        </div>
                      </div>

                      <div className="p-6 bg-primary/5 rounded-2xl border-2 border-primary/10 space-y-2">
                        <Label className="font-bold text-primary">Estimated Break-even (Months)</Label>
                        <div className="flex items-center gap-4">
                          <Input 
                            type="number" 
                            className="w-24 h-12 border-2 border-primary/20 text-center text-xl font-bold text-primary" 
                            {...register("breakEvenMonths", { valueAsNumber: true })} 
                          />
                          <p className="text-xs text-primary/70 font-medium">
                            How many months until your monthly revenue consistently exceeds your monthly expenses?
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Loan Usage Plan */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-8 space-y-8"
                >
                  <div className="bg-orange-50 p-6 rounded-2xl border-2 border-orange-100 flex items-start gap-4">
                    <div className="bg-orange-500 p-2 rounded-lg">
                      <Lightbulb className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-orange-900">Plan Specificity Matters</h3>
                      <p className="text-sm text-orange-800/80 font-medium leading-relaxed">
                        Tell us exactly how you will use this loan. Vague answers like "business expenses" reduce your score. Specific, itemized plans demonstrate better planning.
                      </p>
                    </div>
                  </div>

                  <div className="max-w-md mx-auto text-center space-y-2">
                    <Label className="text-sm font-bold uppercase tracking-widest text-neutral-500">Total Amount Requested</Label>
                    <div className="relative">
                      <span className="absolute left-4 top-4 text-2xl font-black text-neutral-400">{currencySymbol}</span>
                      <Input 
                        type="number" 
                        className="h-20 text-4xl font-black text-center pl-12 border-4 focus:border-primary rounded-2xl" 
                        {...register("requestedAmount", { valueAsNumber: true })} 
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold">Itemized Usage Plan</h3>
                      <Button type="button" variant="outline" onClick={() => appendUsage({ item: '', amount: 0, category: 'stock', isEssential: true })}>
                        <Plus className="w-4 h-4 mr-2" /> Add Item
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {usageFields.map((field, index) => (
                        <div key={field.id} className="p-6 bg-neutral-50 rounded-2xl border-2 border-neutral-100 space-y-4 relative group">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeUsage(index)} 
                            className="absolute top-2 right-2 text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2 space-y-2">
                              <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Item Description</Label>
                              <Input className="border-2" {...register(`loanUsageBreakdown.${index}.item`)} placeholder="e.g. Initial stock purchase (maize, sugar)" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Amount</Label>
                              <div className="relative">
                                <span className="absolute left-3 top-2.5 text-neutral-400 font-bold">{currencySymbol}</span>
                                <Input type="number" className="pl-10 border-2" {...register(`loanUsageBreakdown.${index}.amount`, { valueAsNumber: true })} />
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Category</Label>
                              <Select 
                                onValueChange={(val: any) => setValue(`loanUsageBreakdown.${index}.category`, val)} 
                                defaultValue={watch(`loanUsageBreakdown.${index}.category`)}
                              >
                                <SelectTrigger className="border-2">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="stock">Stock</SelectItem>
                                  <SelectItem value="equipment">Equipment</SelectItem>
                                  <SelectItem value="premises">Premises Deposit/Rent</SelectItem>
                                  <SelectItem value="marketing">Marketing</SelectItem>
                                  <SelectItem value="working_capital">Working Capital</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white rounded-xl border-2">
                              <Label className="font-bold text-sm">Essential Purchase?</Label>
                              <Switch 
                                checked={watch(`loanUsageBreakdown.${index}.isEssential`)} 
                                onCheckedChange={(val) => setValue(`loanUsageBreakdown.${index}.isEssential`, val)} 
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-6 bg-neutral-900 rounded-2xl text-white flex justify-between items-center">
                      <div className="space-y-1">
                        <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">Total Allocated</p>
                        <p className="text-3xl font-black">{currencySymbol}{totalAllocated.toLocaleString()}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">Remaining</p>
                        <p className={`text-xl font-bold ${Math.abs(totalAllocated - requestedAmount) <= 500 ? 'text-green-400' : 'text-orange-400'}`}>
                          {currencySymbol}{(requestedAmount - totalAllocated).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 5: Your Background */}
              {step === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-8 space-y-8"
                >
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-primary" />
                      Experience & Skills
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 bg-neutral-50 rounded-2xl border-2 border-neutral-100 space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="font-bold">Industry Experience?</Label>
                          <Switch checked={watch("hasWorkedInIndustry")} onCheckedChange={(val) => setValue("hasWorkedInIndustry", val)} />
                        </div>
                        {watch("hasWorkedInIndustry") && (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Years in Industry</Label>
                              <Input type="number" className="border-2" {...register("yearsExperienceInIndustry", { valueAsNumber: true })} />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="p-6 bg-neutral-50 rounded-2xl border-2 border-neutral-100 space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="font-bold">Relevant Qualification?</Label>
                          <Switch checked={watch("hasQualification")} onCheckedChange={(val) => setValue("hasQualification", val)} />
                        </div>
                        {watch("hasQualification") && (
                          <Textarea 
                            className="bg-white border-2" 
                            {...register("qualificationDetails")} 
                            placeholder="Describe your training or certificate"
                          />
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-bold uppercase tracking-wider text-neutral-500">Relevant Experience Details</Label>
                      <Textarea 
                        className="min-h-[100px] border-2 resize-none" 
                        {...register("relevantExperience")} 
                        placeholder="Describe your prior work or skills relevant to this business."
                      />
                    </div>

                    <div className="p-6 bg-neutral-50 rounded-2xl border-2 border-neutral-100 space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="font-bold">Run any business before?</Label>
                        <Switch checked={watch("hasRunBusinessBefore")} onCheckedChange={(val) => setValue("hasRunBusinessBefore", val)} />
                      </div>
                      {watch("hasRunBusinessBefore") && (
                        <Textarea 
                          className="bg-white border-2" 
                          {...register("priorBusinessDetails")} 
                          placeholder="Briefly describe your previous business experience"
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-bold uppercase tracking-wider text-neutral-500">Why will you succeed?</Label>
                      <Textarea 
                        className="min-h-[120px] border-2 resize-none" 
                        {...register("whySuccess")} 
                        placeholder="Why do you believe you can make this work? (Min 100 characters)"
                      />
                    </div>
                  </div>

                  <div className="space-y-6 pt-8 border-t">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <History className="w-5 h-5 text-primary" />
                      Personal Financial Profile
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-bold uppercase tracking-wider text-neutral-500">Employment Status</Label>
                        <Select onValueChange={(val: any) => setValue("employmentStatus", val)} defaultValue={watch("employmentStatus")}>
                          <SelectTrigger className="h-12 border-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="employed">Employed</SelectItem>
                            <SelectItem value="self_employed">Self-employed</SelectItem>
                            <SelectItem value="unemployed">Unemployed</SelectItem>
                            <SelectItem value="student">Student</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-bold uppercase tracking-wider text-neutral-500">Monthly Personal Income</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-3 text-neutral-400 font-bold">{currencySymbol}</span>
                          <Input type="number" className="pl-10 h-12 border-2" {...register("monthlyIncome", { valueAsNumber: true })} />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 bg-neutral-50 rounded-2xl border-2 border-neutral-100 space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="font-bold">Existing Loans?</Label>
                          <Switch checked={watch("hasExistingLoans")} onCheckedChange={(val) => setValue("hasExistingLoans", val)} />
                        </div>
                        {watch("hasExistingLoans") && (
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Monthly Repayment</Label>
                            <Input type="number" className="border-2" {...register("monthlyLoanRepayment", { valueAsNumber: true })} />
                          </div>
                        )}
                      </div>

                      <div className="p-6 bg-neutral-50 rounded-2xl border-2 border-neutral-100 space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="font-bold">Do you have savings?</Label>
                          <Switch checked={watch("hasSavings")} onCheckedChange={(val) => setValue("hasSavings", val)} />
                        </div>
                        {watch("hasSavings") && (
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Approx. Savings Amount</Label>
                            <Input type="number" className="border-2" {...register("savingsAmount", { valueAsNumber: true })} />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-sm font-bold uppercase tracking-wider text-neutral-500">Average Monthly M-PESA Activity</Label>
                      <RadioGroup 
                        onValueChange={(val: any) => setValue("mpesaActivity", val)} 
                        defaultValue={watch("mpesaActivity")}
                        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
                      >
                        {[
                          { id: 'under_5000', label: '< 5,000' },
                          { id: '5000_20000', label: '5k - 20k' },
                          { id: '20000_50000', label: '20k - 50k' },
                          { id: 'above_50000', label: '50k+' }
                        ].map(m => (
                          <div key={m.id}>
                            <RadioGroupItem value={m.id} id={m.id} className="peer sr-only" />
                            <Label
                              htmlFor={m.id}
                              className="flex items-center justify-center p-3 border-2 rounded-xl cursor-pointer hover:bg-neutral-50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all text-sm font-bold"
                            >
                              {m.label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 6: Review & Submit */}
              {step === 6 && (
                <motion.div
                  key="step6"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-8 space-y-12"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-8">
                      <div className="space-y-4">
                        <h3 className="text-2xl font-black uppercase tracking-tight text-neutral-900 flex items-center gap-2">
                          <FileText className="w-6 h-6 text-primary" />
                          Plan Summary
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-neutral-50 rounded-xl">
                            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Business</p>
                            <p className="font-bold">{watch("businessName")}</p>
                          </div>
                          <div className="p-4 bg-neutral-50 rounded-xl">
                            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Industry</p>
                            <p className="font-bold capitalize">{watch("industry")}</p>
                          </div>
                          <div className="p-4 bg-neutral-50 rounded-xl">
                            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Requested</p>
                            <p className="font-bold text-primary">{currencySymbol}{requestedAmount.toLocaleString()}</p>
                          </div>
                          <div className="p-4 bg-neutral-50 rounded-xl">
                            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Stage</p>
                            <p className="font-bold capitalize">{watch("stage").replace('_', ' ')}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-primary" />
                          Revenue Projections
                        </h3>
                        <div className="h-[200px] w-full bg-neutral-50 rounded-2xl p-4">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
                              <YAxis hide />
                              <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#3b82f6" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <div className="space-y-4">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                          <PieChartIcon className="w-5 h-5 text-primary" />
                          Loan Usage Breakdown
                        </h3>
                        <div className="h-[200px] w-full flex items-center justify-center bg-neutral-50 rounded-2xl p-4">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={usageChartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {usageChartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {usageChartData.map((entry, index) => (
                            <div key={entry.name} className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                              <span className="text-xs font-bold capitalize text-neutral-600">{entry.name.replace('_', ' ')}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                          <FileText className="w-5 h-5 text-primary" />
                          Required Documents
                        </h3>
                        <div className="space-y-3">
                          <DocumentUpload 
                            documentType="businessplandocument" 
                            label="Business Plan" 
                            description="Download and fill our template" 
                            required={true} 
                            userId={auth.currentUser?.uid || ''} 
                            onUploadComplete={handleDocumentUpload}
                            onDelete={handleDocumentDelete}
                            existingDocument={documents['businessplandocument']}
                          />
                          <DocumentUpload 
                            documentType="personalmpesastatement" 
                            label="M-PESA Statement" 
                            description="Last 3 months (personal)" 
                            required={true} 
                            userId={auth.currentUser?.uid || ''} 
                            onUploadComplete={handleDocumentUpload}
                            onDelete={handleDocumentDelete}
                            existingDocument={documents['personalmpesastatement']}
                            periodRequired={true}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 bg-primary/5 rounded-3xl border-2 border-primary/10 space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-primary p-2 rounded-lg">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-primary">Ready to Submit</h4>
                        <p className="text-sm text-primary/70 font-medium leading-relaxed">
                          Your plan will be assessed by AI. You will also need to provide supporting documents and guarantors before your application is complete.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch id="consent" required />
                      <Label htmlFor="consent" className="text-sm font-medium text-neutral-600">
                        I confirm that all information provided is accurate and I consent to the AI assessment of my business plan.
                      </Label>
                    </div>
                    <Button type="submit" disabled={isLoading} className="w-full h-16 text-xl font-black uppercase tracking-widest shadow-xl shadow-primary/20">
                      {isLoading ? "Analyzing Your Plan..." : "Submit for AI Assessment"}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>

          <div className="p-8 border-t bg-neutral-50/50 flex justify-between rounded-b-xl">
            {step > 1 ? (
              <Button type="button" variant="ghost" onClick={prevStep} className="h-12 px-6 font-bold">
                <ArrowLeft className="mr-2 h-5 w-5" />
                Back
              </Button>
            ) : <div />}
            
            {step < totalSteps && (
              <Button type="button" onClick={nextStep} className="h-12 px-8 font-bold">
                Next Step
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
};

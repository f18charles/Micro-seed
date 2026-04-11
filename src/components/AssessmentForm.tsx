import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Building2, MapPin, TrendingUp, Target, AlertCircle, ArrowRight, ArrowLeft, FileCheck, ShieldCheck, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { BusinessIndustry, SubmittedDocument, LenderConfig } from "../types";
import DocumentUpload from "./DocumentUpload";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const assessmentSchema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  industry: z.enum(['retail', 'food_beverage', 'services', 'manufacturing', 'agriculture', 'technology', 'other'] as const),
  location: z.string().min(3, "Location is required"),
  yearsInOperation: z.number().min(0),
  monthlyRevenue: z.number().min(0),
  monthlyExpenses: z.number().min(0),
  description: z.string().min(10, "Please provide a more detailed description"),
  goals: z.string().min(10, "Please share your growth goals"),
  documentIds: z.array(z.string()).optional(),
});

type AssessmentFormData = z.infer<typeof assessmentSchema>;

interface AssessmentFormProps {
  onSubmit: (data: AssessmentFormData & { documents?: SubmittedDocument[] }) => void;
  isLoading: boolean;
  currencySymbol: string;
  initialData?: Partial<AssessmentFormData>;
}

export default function AssessmentForm({ onSubmit, isLoading, currencySymbol, initialData }: AssessmentFormProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 5;
  const [documents, setDocuments] = useState<Record<string, SubmittedDocument>>({});
  const [lenderConfig, setLenderConfig] = useState<LenderConfig | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      const snap = await getDoc(doc(db, 'app_settings', 'lender_config'));
      if (snap.exists()) setLenderConfig(snap.data() as LenderConfig);
    };
    fetchConfig();
  }, []);

  const { register, handleSubmit, formState: { errors }, trigger, watch, setValue } = useForm<AssessmentFormData>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      industry: 'retail',
      yearsInOperation: 0,
      monthlyRevenue: 0,
      monthlyExpenses: 0,
      documentIds: [],
      ...initialData
    }
  });

  const watchRevenue = watch("monthlyRevenue");
  const watchExpenses = watch("monthlyExpenses");
  const showExpenseWarning = watchExpenses >= watchRevenue && watchRevenue > 0;

  const handleDocumentUpload = (doc: SubmittedDocument) => {
    setDocuments(prev => ({ ...prev, [doc.type]: doc }));
    const currentIds = watch("documentIds") || [];
    if (!currentIds.includes(doc.id)) {
      setValue("documentIds", [...currentIds, doc.id]);
    }
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof AssessmentFormData)[] = [];
    if (step === 1) fieldsToValidate = ["businessName", "industry", "location"];
    if (step === 2) fieldsToValidate = ["yearsInOperation", "monthlyRevenue", "monthlyExpenses"];
    if (step === 3) fieldsToValidate = ["description", "goals"];
    
    const isValid = await trigger(fieldsToValidate);
    
    if (isValid) {
      if (step === 4) {
        const minMonths = lenderConfig?.minDocumentMonths || 3;
        const financialDocs = Object.values(documents).filter(d => 
          ['bank_statement', 'mpesa_statement'].includes(d.type)
        );
        if (financialDocs.length === 0) {
          alert(`Please upload at least one financial statement.`);
          return;
        }
      }
      setStep(s => s + 1);
    }
  };

  const prevStep = () => setStep(s => s - 1);

  const handleFinalSubmit = (data: AssessmentFormData) => {
    onSubmit({ ...data, documents: Object.values(documents) });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8 space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Business Assessment</h1>
            <p className="text-muted-foreground">Step {step} of {totalSteps}</p>
          </div>
          <div className="text-right">
            <span className="text-sm font-medium text-primary">{Math.round((step / totalSteps) * 100)}% Complete</span>
          </div>
        </div>
        <Progress value={(step / totalSteps) * 100} className="h-2" />
      </div>

      <Card className="border-none shadow-xl shadow-neutral-200/50">
        <form onSubmit={handleSubmit(handleFinalSubmit)}>
          <CardContent className="p-8">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="businessName" className="pl-10" {...register("businessName")} placeholder="e.g. Mama's Kitchen" />
                    </div>
                    {errors.businessName && <p className="text-xs text-destructive">{errors.businessName.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Select onValueChange={(val: BusinessIndustry) => setValue("industry", val)} defaultValue={watch("industry")}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="food_beverage">Food & Beverage</SelectItem>
                        <SelectItem value="services">Services</SelectItem>
                        <SelectItem value="manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="agriculture">Agriculture</SelectItem>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="location" className="pl-10" {...register("location")} placeholder="City, Region" />
                    </div>
                    {errors.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <Label htmlFor="yearsInOperation">Years in Operation</Label>
                    <Input id="yearsInOperation" type="number" {...register("yearsInOperation", { valueAsNumber: true })} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="monthlyRevenue">Monthly Revenue ({currencySymbol})</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">{currencySymbol}</span>
                        <Input id="monthlyRevenue" type="number" className="pl-10" {...register("monthlyRevenue", { valueAsNumber: true })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="monthlyExpenses">Monthly Expenses ({currencySymbol})</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">{currencySymbol}</span>
                        <Input id="monthlyExpenses" type="number" className="pl-10" {...register("monthlyExpenses", { valueAsNumber: true })} />
                      </div>
                    </div>
                  </div>

                  {showExpenseWarning && (
                    <Alert className="bg-amber-50 border-amber-200 text-amber-800">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <AlertTitle>Financial Warning</AlertTitle>
                      <AlertDescription className="text-xs">
                        Your expenses meet or exceed your revenue. This may affect your loan eligibility and potential score.
                      </AlertDescription>
                    </Alert>
                  )}
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <Label htmlFor="description">Business Description</Label>
                    <div className="relative">
                      <TrendingUp className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Textarea id="description" className="pl-10 min-h-[120px]" {...register("description")} placeholder="Tell us about what your business does..." />
                    </div>
                    {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="goals">Growth Goals</Label>
                    <div className="relative">
                      <Target className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Textarea id="goals" className="pl-10 min-h-[120px]" {...register("goals")} placeholder="What would you do with additional capital?" />
                    </div>
                    {errors.goals && <p className="text-xs text-destructive">{errors.goals.message}</p>}
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-primary" />
                      Financial Evidence
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Upload {lenderConfig?.minDocumentMonths || 3}–6 months of financial records to verify your revenue.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <DocumentUpload 
                      documentType="mpesa_statement" 
                      label="M-PESA Statement" 
                      description="Last 3-6 months statement" 
                      required={true} 
                      userId={auth.currentUser?.uid || ''} 
                      onUploadComplete={handleDocumentUpload}
                      existingDocument={documents['mpesa_statement']}
                      periodRequired={true}
                    />
                    <DocumentUpload 
                      documentType="bank_statement" 
                      label="Bank Statement" 
                      description="Last 3-6 months statement" 
                      required={false} 
                      userId={auth.currentUser?.uid || ''} 
                      onUploadComplete={handleDocumentUpload}
                      existingDocument={documents['bank_statement']}
                      periodRequired={true}
                    />
                  </div>

                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3">
                    <Info className="w-5 h-5 text-blue-600 shrink-0" />
                    <p className="text-xs text-blue-800">
                      Your documents will be analysed by AI to cross-check against your stated revenue of {currencySymbol} {watchRevenue.toLocaleString()}. A deviation of up to {lenderConfig?.acceptableRevenueDeviation || 20}% is acceptable.
                    </p>
                  </div>
                </motion.div>
              )}

              {step === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-primary" />
                      Compliance & Trust
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Optional but highly recommended. These documents increase your trust score and loan eligibility.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <DocumentUpload 
                      documentType="business_permit" 
                      label="Business Permit" 
                      description="County business permit" 
                      required={false} 
                      userId={auth.currentUser?.uid || ''} 
                      onUploadComplete={handleDocumentUpload}
                      existingDocument={documents['business_permit']}
                    />
                    <DocumentUpload 
                      documentType="tax_compliance" 
                      label="Tax Compliance Certificate" 
                      description="Valid KRA Tax Compliance Certificate" 
                      required={false} 
                      userId={auth.currentUser?.uid || ''} 
                      onUploadComplete={handleDocumentUpload}
                      existingDocument={documents['tax_compliance']}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>

          <div className="p-8 border-t bg-neutral-50/50 flex justify-between rounded-b-xl">
            {step > 1 ? (
              <Button type="button" variant="ghost" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            ) : <div />}
            
            {step < totalSteps ? (
              <Button type="button" onClick={nextStep}>
                Next Step
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={isLoading} className="px-8">
                {isLoading ? "Analyzing Potential..." : "Submit Assessment"}
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}

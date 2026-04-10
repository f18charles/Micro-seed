import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { BusinessIndustry } from "../types";

const formSchema = z.object({
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  industry: z.string().min(1, "Please select an industry"),
  yearsInOperation: z.number().min(0),
  monthlyRevenue: z.number().min(0),
  monthlyExpenses: z.number().min(0),
  location: z.string().min(2, "Location is required"),
  description: z.string().min(10, "Please provide a brief description"),
  goals: z.string().min(10, "Please share your business goals"),
});

type FormValues = z.infer<typeof formSchema>;

interface AssessmentFormProps {
  onSubmit: (values: FormValues) => void;
  isLoading: boolean;
}

export default function AssessmentForm({ onSubmit, isLoading }: AssessmentFormProps) {
  const [step, setStep] = useState(1);
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      yearsInOperation: 0,
      monthlyRevenue: 0,
      monthlyExpenses: 0,
    }
  });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const industry = watch("industry");

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-neutral-900">Business Potential Assessment</CardTitle>
          <CardDescription>Tell us about your business to see your potential score and loan eligibility.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input id="businessName" {...register("businessName")} placeholder="e.g. Sunshine Bakery" />
                    {errors.businessName && <p className="text-sm text-destructive">{errors.businessName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Select onValueChange={(v) => setValue("industry", v)} value={industry}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
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
                    {errors.industry && <p className="text-sm text-destructive">{errors.industry.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" {...register("location")} placeholder="City, Country" />
                    {errors.location && <p className="text-sm text-destructive">{errors.location.message}</p>}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="yearsInOperation">Years in Operation</Label>
                      <Input id="yearsInOperation" type="number" {...register("yearsInOperation", { valueAsNumber: true })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="monthlyRevenue">Avg. Monthly Revenue ($)</Label>
                      <Input id="monthlyRevenue" type="number" {...register("monthlyRevenue", { valueAsNumber: true })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthlyExpenses">Avg. Monthly Expenses ($)</Label>
                    <Input id="monthlyExpenses" type="number" {...register("monthlyExpenses", { valueAsNumber: true })} />
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="description">Business Description</Label>
                    <textarea 
                      id="description" 
                      {...register("description")} 
                      className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="What does your business do?"
                    />
                    {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="goals">Growth Goals</Label>
                    <textarea 
                      id="goals" 
                      {...register("goals")} 
                      className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="What are your plans for the next 12 months?"
                    />
                    {errors.goals && <p className="text-sm text-destructive">{errors.goals.message}</p>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-between mt-8">
              {step > 1 && (
                <Button type="button" variant="outline" onClick={prevStep}>
                  Back
                </Button>
              )}
              {step < 3 ? (
                <Button type="button" className="ml-auto" onClick={nextStep}>
                  Next
                </Button>
              ) : (
                <Button type="submit" className="ml-auto" disabled={isLoading}>
                  {isLoading ? "Analyzing..." : "Submit Assessment"}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

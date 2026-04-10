import { motion } from "motion/react";
import { ArrowRight, BarChart3, ShieldCheck, Zap } from "lucide-react";
import { Button } from "./ui/button";

interface LandingPageProps {
  onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 pt-24 pb-32 sm:pt-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl text-neutral-900">
              Empowering Small Businesses with <span className="text-primary">MicroSeed</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-neutral-600">
              No credit? No problem. We assess your business potential using AI and offer microloans to help you grow.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button size="lg" onClick={onStart} className="rounded-full px-8 py-6 text-lg">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-primary">Grow Faster</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              Everything you need to scale your business
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-neutral-900">
                  <Zap className="h-5 w-5 flex-none text-primary" />
                  AI Assessment
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-neutral-600">
                  <p className="flex-auto">Our advanced AI analyzes your business metrics and potential, providing a fair assessment regardless of your credit score.</p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-neutral-900">
                  <ShieldCheck className="h-5 w-5 flex-none text-primary" />
                  Microloans
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-neutral-600">
                  <p className="flex-auto">Access small, manageable loans tailored to your business needs and growth potential.</p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-neutral-900">
                  <BarChart3 className="h-5 w-5 flex-none text-primary" />
                  Growth Insights
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-neutral-600">
                  <p className="flex-auto">Receive personalized recommendations and track your business growth with our intuitive dashboard.</p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>
    </div>
  );
}

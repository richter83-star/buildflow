import * as React from "react";
import { useNavigate } from "react-router";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  Clock,
  Trophy,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import confetti from "canvas-confetti";

interface ChecklistStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  link?: string;
  estimatedMinutes?: number;
  badge?: string;
}

interface OnboardingChecklistProps {
  steps: ChecklistStep[];
  onStepComplete?: (stepId: string) => void;
  onStepClick?: (stepId: string) => void;
  onDismiss?: () => void;
  storageKey?: string;
  className?: string;
}

export function OnboardingChecklist({
  steps: initialSteps,
  onStepComplete,
  onStepClick,
  onDismiss,
  storageKey = "onboarding-checklist",
  className,
}: OnboardingChecklistProps) {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [steps, setSteps] = React.useState(initialSteps);
  const [showConfetti, setShowConfetti] = React.useState(false);

  // Load state from localStorage
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const { steps: savedSteps, isCollapsed: savedCollapsed } =
            JSON.parse(saved);
          setSteps(savedSteps);
          setIsCollapsed(savedCollapsed);
        } catch (e) {
          console.error("Failed to load checklist state:", e);
        }
      }
    }
  }, [storageKey]);

  // Save state to localStorage
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ steps, isCollapsed })
      );
    }
  }, [steps, isCollapsed, storageKey]);

  const completedCount = steps.filter((s) => s.completed).length;
  const totalCount = steps.length;
  const progress = (completedCount / totalCount) * 100;
  const isFullyCompleted = completedCount === totalCount;

  const handleStepToggle = (stepId: string) => {
    const wasCompleted = steps.find((s) => s.id === stepId)?.completed;

    setSteps((prev) =>
      prev.map((step) =>
        step.id === stepId ? { ...step, completed: !step.completed } : step
      )
    );

    if (!wasCompleted) {
      // Trigger confetti for completion
      triggerConfetti();
      if (onStepComplete) {
        onStepComplete(stepId);
      }
    }
  };

  const handleStepNavigate = (step: ChecklistStep) => {
    if (step.link) {
      navigate(step.link);
    }
    if (onStepClick) {
      onStepClick(step.id);
    }
  };

  const triggerConfetti = () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999,
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });

    fire(0.2, {
      spread: 60,
    });

    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  };

  const totalEstimatedTime = steps
    .filter((s) => !s.completed)
    .reduce((acc, step) => acc + (step.estimatedMinutes || 0), 0);

  if (isFullyCompleted && onDismiss) {
    return null;
  }

  return (
    <Card
      className={cn(
        "fixed bottom-4 right-4 z-50 w-96 shadow-lg transition-all duration-300",
        isCollapsed && "w-20",
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        {!isCollapsed && (
          <>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Getting Started</CardTitle>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onDismiss}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </>
        )}
        {isCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 mx-auto"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="space-y-4">
          {/* Progress Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {completedCount} of {totalCount} completed
              </span>
              {isFullyCompleted ? (
                <div className="flex items-center gap-1 text-emerald-600">
                  <Trophy className="h-4 w-4" />
                  <span className="font-semibold">Complete!</span>
                </div>
              ) : (
                <span className="text-muted-foreground">
                  {Math.round(progress)}%
                </span>
              )}
            </div>
            <Progress value={progress} className="h-2" />
            {!isFullyCompleted && totalEstimatedTime > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>~{totalEstimatedTime} min remaining</span>
              </div>
            )}
          </div>

          {/* Steps List */}
          <div className="space-y-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "group flex items-start gap-3 rounded-lg border p-3 transition-all",
                  step.completed
                    ? "bg-muted/50 border-muted"
                    : "hover:bg-accent hover:border-accent-foreground/20 cursor-pointer",
                  step.link && !step.completed && "hover:shadow-sm"
                )}
                onClick={() =>
                  !step.completed && handleStepNavigate(step)
                }
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStepToggle(step.id);
                  }}
                  className="mt-0.5 flex-shrink-0"
                >
                  {step.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  )}
                </button>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p
                      className={cn(
                        "text-sm font-medium leading-none",
                        step.completed && "line-through text-muted-foreground"
                      )}
                    >
                      {step.title}
                    </p>
                    {step.badge && !step.completed && (
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {step.badge}
                      </span>
                    )}
                  </div>
                  <p
                    className={cn(
                      "text-xs text-muted-foreground",
                      step.completed && "line-through"
                    )}
                  >
                    {step.description}
                  </p>
                  {step.estimatedMinutes && !step.completed && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{step.estimatedMinutes} min</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Achievement Message */}
          {isFullyCompleted && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
              <Trophy className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-emerald-600">
                Congratulations! 🎉
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                You've completed all onboarding steps!
              </p>
            </div>
          )}
        </CardContent>
      )}

      {/* Collapsed State - Progress Ring */}
      {isCollapsed && (
        <CardContent className="pb-4">
          <div className="relative w-12 h-12 mx-auto">
            <svg className="w-12 h-12 transform -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className="text-muted"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 20}`}
                strokeDashoffset={`${2 * Math.PI * 20 * (1 - progress / 100)}`}
                className="text-primary transition-all duration-300"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-semibold">
                {completedCount}/{totalCount}
              </span>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export type { ChecklistStep };

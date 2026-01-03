"use client";

import * as React from "react";
import { Check, ChevronRight, Clock, AlertCircle } from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";

export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  content?: React.ReactNode;
  estimatedMinutes?: number;
  validation?: () => boolean | Promise<boolean>;
  onComplete?: () => void | Promise<void>;
}

interface WorkflowStepperProps {
  steps: WorkflowStep[];
  currentStep?: number;
  onStepChange?: (stepIndex: number) => void;
  onComplete?: () => void;
  onSaveDraft?: (currentStep: number, data?: any) => void;
  savedStep?: number;
  className?: string;
  orientation?: "horizontal" | "vertical";
  allowStepNavigation?: boolean;
}

export function WorkflowStepper({
  steps,
  currentStep: controlledStep,
  onStepChange,
  onComplete,
  onSaveDraft,
  savedStep,
  className,
  orientation = "horizontal",
  allowStepNavigation = true,
}: WorkflowStepperProps) {
  const [internalStep, setInternalStep] = React.useState(savedStep || 0);
  const [completedSteps, setCompletedSteps] = React.useState<Set<number>>(
    new Set(savedStep ? Array.from({ length: savedStep }, (_, i) => i) : [])
  );
  const [validationError, setValidationError] = React.useState<string | null>(null);
  const [isValidating, setIsValidating] = React.useState(false);

  const currentStepIndex = controlledStep !== undefined ? controlledStep : internalStep;
  const currentStepData = steps[currentStepIndex];

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleStepChange = (newStep: number) => {
    if (onStepChange) {
      onStepChange(newStep);
    } else {
      setInternalStep(newStep);
    }
    setValidationError(null);
  };

  const handleNext = async () => {
    setValidationError(null);
    setIsValidating(true);

    try {
      // Run validation if provided
      if (currentStepData.validation) {
        const isValid = await currentStepData.validation();
        if (!isValid) {
          setValidationError("Please complete all required fields before proceeding.");
          setIsValidating(false);
          return;
        }
      }

      // Mark step as completed
      setCompletedSteps((prev) => new Set([...prev, currentStepIndex]));

      // Call onComplete callback for current step
      if (currentStepData.onComplete) {
        await currentStepData.onComplete();
      }

      // Move to next step or complete workflow
      if (isLastStep) {
        if (onComplete) {
          onComplete();
        }
      } else {
        handleStepChange(currentStepIndex + 1);
      }
    } catch (error) {
      setValidationError(
        error instanceof Error ? error.message : "An error occurred. Please try again."
      );
    } finally {
      setIsValidating(false);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      handleStepChange(currentStepIndex - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    if (!allowStepNavigation) return;

    // Allow navigation to completed steps or the next step
    if (completedSteps.has(stepIndex) || stepIndex === currentStepIndex + 1) {
      handleStepChange(stepIndex);
    }
  };

  const handleSaveDraft = () => {
    if (onSaveDraft) {
      onSaveDraft(currentStepIndex);
    }
  };

  const getTotalEstimatedTime = () => {
    return steps.reduce((acc, step) => acc + (step.estimatedMinutes || 0), 0);
  };

  const getRemainingTime = () => {
    return steps
      .slice(currentStepIndex)
      .reduce((acc, step) => acc + (step.estimatedMinutes || 0), 0);
  };

  const StepIndicator = ({ step, index }: { step: WorkflowStep; index: number }) => {
    const isCompleted = completedSteps.has(index);
    const isCurrent = index === currentStepIndex;
    const isClickable =
      allowStepNavigation && (isCompleted || index === currentStepIndex + 1);

    return (
      <button
        onClick={() => handleStepClick(index)}
        disabled={!isClickable}
        className={cn(
          "flex items-center gap-3 transition-all",
          orientation === "horizontal" ? "flex-col text-center" : "flex-row",
          isClickable && "cursor-pointer hover:opacity-80",
          !isClickable && "cursor-not-allowed opacity-50"
        )}
      >
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
            isCompleted &&
              "border-emerald-600 bg-emerald-600 text-white",
            isCurrent &&
              !isCompleted &&
              "border-primary bg-primary text-primary-foreground",
            !isCurrent &&
              !isCompleted &&
              "border-muted-foreground/30 bg-background text-muted-foreground"
          )}
        >
          {isCompleted ? (
            <Check className="h-5 w-5" />
          ) : (
            <span className="text-sm font-semibold">{index + 1}</span>
          )}
        </div>
        <div className={cn(orientation === "horizontal" ? "max-w-[120px]" : "flex-1")}>
          <p
            className={cn(
              "text-sm font-medium",
              isCurrent && "text-foreground",
              !isCurrent && "text-muted-foreground"
            )}
          >
            {step.title}
          </p>
          {orientation === "vertical" && (
            <p className="text-xs text-muted-foreground">{step.description}</p>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            Step {currentStepIndex + 1} of {steps.length}
          </span>
          <div className="flex items-center gap-4 text-muted-foreground">
            {getRemainingTime() > 0 && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>~{getRemainingTime()} min remaining</span>
              </div>
            )}
            <span>{Math.round(progress)}% complete</span>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Indicators */}
      <div
        className={cn(
          "flex gap-4",
          orientation === "horizontal"
            ? "justify-between overflow-x-auto pb-2"
            : "flex-col"
        )}
      >
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <StepIndicator step={step} index={index} />
            {index < steps.length - 1 && orientation === "horizontal" && (
              <ChevronRight className="h-10 w-10 flex-shrink-0 text-muted-foreground/30 self-center" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Current Step Content */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle>{currentStepData.title}</CardTitle>
              <CardDescription>{currentStepData.description}</CardDescription>
            </div>
            {currentStepData.estimatedMinutes && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{currentStepData.estimatedMinutes} min</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step Content */}
          {currentStepData.content}

          {/* Validation Error */}
          {validationError && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>{validationError}</p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={isFirstStep || isValidating}
              >
                Previous
              </Button>
              {onSaveDraft && (
                <Button
                  variant="ghost"
                  onClick={handleSaveDraft}
                  disabled={isValidating}
                >
                  Save Draft
                </Button>
              )}
            </div>
            <Button onClick={handleNext} disabled={isValidating}>
              {isValidating
                ? "Validating..."
                : isLastStep
                  ? "Complete"
                  : "Next"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview of Next Steps */}
      {!isLastStep && (
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-sm font-medium mb-2">Coming up next:</p>
          <div className="space-y-2">
            {steps.slice(currentStepIndex + 1, currentStepIndex + 3).map((step, idx) => (
              <div key={step.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                  {currentStepIndex + idx + 2}
                </span>
                <span>{step.title}</span>
                {step.estimatedMinutes && (
                  <span className="text-xs">({step.estimatedMinutes} min)</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export type { WorkflowStepperProps };

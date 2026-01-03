import { redirect, type LoaderFunctionArgs } from "react-router";
import { callTrpc } from "~/utils/trpc.server";
import { PortalShell } from "~/components/portal/PortalShell";
import { PAID_OFFER } from "~/utils/offer";
import { CommandPalette } from "~/components/ui/command-palette";
import { OnboardingChecklist, type ChecklistStep } from "~/components/ui/onboarding-checklist";
import { WorkflowStepper, type WorkflowStep } from "~/components/ui/workflow-stepper";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const caller = await callTrpc(request);
  const session = await caller.auth.me();

  if (!session.isSignedIn) return redirect("/login");

  const hasEntitlement = await caller.portal.hasEntitlement({
    productSlug: PAID_OFFER.productSlug,
  });
  if (!hasEntitlement) return redirect("/checkout");

  return {};
}

export default function PortalDemoPage() {
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [formData, setFormData] = useState({
    template: "",
    name: "",
    description: "",
  });

  // Onboarding Checklist Steps
  const checklistSteps: ChecklistStep[] = [
    {
      id: "explore-portal",
      title: "Explore the Portal",
      description: "Take a tour of available tools and features",
      completed: false,
      link: "/portal/start",
      estimatedMinutes: 5,
      badge: "Start Here",
    },
    {
      id: "complete-setup",
      title: "Complete Setup",
      description: "Configure your workspace and preferences",
      completed: false,
      link: "/portal/setup",
      estimatedMinutes: 10,
    },
    {
      id: "try-seo-tools",
      title: "Try SEO Tools",
      description: "Generate your first SEO brief or keyword research",
      completed: false,
      link: "/portal/seo",
      estimatedMinutes: 15,
    },
    {
      id: "download-resources",
      title: "Download Resources",
      description: "Get starter templates and guides",
      completed: false,
      link: "/portal/downloads",
      estimatedMinutes: 3,
    },
  ];

  // Workflow Steps
  const workflowSteps: WorkflowStep[] = [
    {
      id: "select-template",
      title: "Select Template",
      description: "Choose an automation template to get started",
      estimatedMinutes: 2,
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template">Automation Template</Label>
            <select
              id="template"
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              value={formData.template}
              onChange={(e) =>
                setFormData({ ...formData, template: e.target.value })
              }
            >
              <option value="">Select a template...</option>
              <option value="seo-brief">SEO Content Brief Generator</option>
              <option value="keyword-research">Keyword Research Automation</option>
              <option value="content-outline">Content Outline Creator</option>
              <option value="meta-tags">Meta Tags Generator</option>
            </select>
          </div>
          <div className="rounded-lg bg-muted p-4 text-sm">
            <p className="font-medium mb-2">Template Features:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Pre-configured prompts and workflows</li>
              <li>Customizable parameters</li>
              <li>Integration with your existing tools</li>
              <li>Best practices built-in</li>
            </ul>
          </div>
        </div>
      ),
      validation: () => {
        return formData.template !== "";
      },
      onComplete: async () => {
        console.log("Template selected:", formData.template);
      },
    },
    {
      id: "configure",
      title: "Configure Automation",
      description: "Set up your automation parameters and preferences",
      estimatedMinutes: 5,
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Automation Name</Label>
            <Input
              id="name"
              placeholder="e.g., My SEO Brief Generator"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what this automation does..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={4}
            />
          </div>
          <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4 text-sm">
            <p className="font-medium text-blue-600 mb-1">💡 Pro Tip</p>
            <p className="text-muted-foreground">
              Give your automation a descriptive name so you can easily find it later.
              Include the purpose or target keyword in the name.
            </p>
          </div>
        </div>
      ),
      validation: async () => {
        if (formData.name.length < 3) {
          throw new Error("Automation name must be at least 3 characters");
        }
        return true;
      },
    },
    {
      id: "preview",
      title: "Preview & Deploy",
      description: "Review your automation settings before deployment",
      estimatedMinutes: 2,
      content: (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automation Summary</CardTitle>
              <CardDescription>
                Review your configuration before deploying
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Template
                </p>
                <p className="text-base">{formData.template || "Not selected"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Name</p>
                <p className="text-base">{formData.name || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Description
                </p>
                <p className="text-base">
                  {formData.description || "No description"}
                </p>
              </div>
            </CardContent>
          </Card>
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm">
            <p className="font-medium text-emerald-600 mb-1">✅ Ready to Deploy</p>
            <p className="text-muted-foreground">
              Your automation is configured and ready. Click "Complete" to deploy it
              to your workspace.
            </p>
          </div>
        </div>
      ),
    },
  ];

  const handleWorkflowComplete = () => {
    console.log("Workflow completed!", formData);
    alert("Automation deployed successfully! 🎉");
    setShowWorkflow(false);
    // Reset form
    setFormData({ template: "", name: "", description: "" });
  };

  const handleSaveDraft = (currentStep: number) => {
    localStorage.setItem(
      "automation-draft",
      JSON.stringify({ step: currentStep, data: formData })
    );
    alert("Draft saved! You can continue later.");
  };

  return (
    <PortalShell
      title="Component Demo"
      subtitle="Interactive demonstration of the new UI components"
    >
      {/* Command Palette - Always active */}
      <CommandPalette />

      {/* Onboarding Checklist - Floating widget */}
      <OnboardingChecklist
        steps={checklistSteps}
        onStepComplete={(stepId) => {
          console.log("Step completed:", stepId);
        }}
        storageKey="portal-demo-checklist"
      />

      <div className="space-y-8">
        {/* Introduction */}
        <Card>
          <CardHeader>
            <CardTitle>Welcome to the Component Demo</CardTitle>
            <CardDescription>
              This page demonstrates three new UI components designed to enhance user
              experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Active Components:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>
                  <strong>Command Palette:</strong> Press{" "}
                  <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">
                    Cmd/Ctrl + K
                  </kbd>{" "}
                  to open
                </li>
                <li>
                  <strong>Onboarding Checklist:</strong> See the floating widget in
                  the bottom-right corner
                </li>
                <li>
                  <strong>Workflow Stepper:</strong> Click the button below to start
                  a demo workflow
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Workflow Demo Section */}
        {!showWorkflow ? (
          <Card>
            <CardHeader>
              <CardTitle>Multi-Step Workflow Demo</CardTitle>
              <CardDescription>
                Try out the workflow stepper component with a sample automation
                creation process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setShowWorkflow(true)} size="lg">
                Start Workflow Demo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <WorkflowStepper
            steps={workflowSteps}
            onComplete={handleWorkflowComplete}
            onSaveDraft={handleSaveDraft}
            orientation="horizontal"
            allowStepNavigation={true}
          />
        )}

        {/* Documentation Links */}
        <Card>
          <CardHeader>
            <CardTitle>Documentation</CardTitle>
            <CardDescription>
              Learn more about these components and how to use them
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              For detailed documentation, usage examples, and integration guides, see:
            </p>
            <code className="block bg-muted p-2 rounded text-sm">
              docs/UI_COMPONENTS_GUIDE.md
            </code>
          </CardContent>
        </Card>
      </div>
    </PortalShell>
  );
}

# UI Components Guide

This guide provides detailed documentation and usage examples for the three new UI components that enhance user experience.

## Table of Contents

1. [Command Palette](#1-command-palette)
2. [Onboarding Checklist](#2-onboarding-checklist)
3. [Workflow Stepper](#3-workflow-stepper)

---

## 1. Command Palette

A keyboard-driven command center that provides quick access to any part of your application.

### Features

- ⌨️ Keyboard shortcut (`Cmd/Ctrl + K`) for instant access
- 🔍 Fuzzy search across all actions
- 📝 Recent actions tracking
- 🎯 Categorized actions
- ⚡ Custom keyboard shortcuts
- 📱 Responsive design

### Installation

The component is already created at `app/components/ui/command-palette.tsx`.

### Basic Usage

```tsx
import { CommandPalette } from "~/components/ui/command-palette";

export default function App() {
  return (
    <div>
      {/* Your app content */}
      <CommandPalette />
    </div>
  );
}
```

### Advanced Usage with Custom Actions

```tsx
import { CommandPalette, type CommandAction } from "~/components/ui/command-palette";
import { FileText, Settings } from "lucide-react";

export default function App() {
  const customActions: CommandAction[] = [
    {
      id: "create-project",
      label: "Create New Project",
      description: "Start a new automation project",
      icon: FileText,
      shortcut: "⌘N",
      action: () => {
        // Your custom logic
        console.log("Creating new project...");
      },
      category: "Actions",
      keywords: ["new", "create", "project", "start"],
    },
    {
      id: "settings",
      label: "Open Settings",
      description: "Configure your preferences",
      icon: Settings,
      action: () => navigate("/settings"),
      category: "Navigation",
    },
  ];

  const handleActionExecute = (actionId: string) => {
    // Track action execution
    console.log(`Action executed: ${actionId}`);
  };

  return (
    <CommandPalette
      actions={customActions}
      recentActions={["portal", "dashboard"]}
      onActionExecute={handleActionExecute}
    />
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `actions` | `CommandAction[]` | Default actions | Custom actions to display |
| `recentActions` | `string[]` | `[]` | Array of recently used action IDs |
| `onActionExecute` | `(actionId: string) => void` | - | Callback when action is executed |

### CommandAction Interface

```typescript
interface CommandAction {
  id: string;                    // Unique identifier
  label: string;                 // Display name
  description?: string;          // Optional description
  icon?: LucideIcon;            // Optional icon component
  shortcut?: string;            // Optional keyboard shortcut display
  action: () => void;           // Function to execute
  category: string;             // Category for grouping
  keywords?: string[];          // Additional search keywords
}
```

---

## 2. Onboarding Checklist

A gamified checklist widget that guides users through setup with progress tracking and celebrations.

### Features

- ✅ Step-by-step progress tracking
- 🎉 Confetti animations on completion
- ⏱️ Estimated time for each step
- 💾 Persistent state (localStorage)
- 🎯 Direct navigation to relevant pages
- 📊 Visual progress indicators
- 🔄 Collapsible interface

### Installation

1. The component is at `app/components/ui/onboarding-checklist.tsx`
2. Package `canvas-confetti` is already installed

### Basic Usage

```tsx
import { OnboardingChecklist, type ChecklistStep } from "~/components/ui/onboarding-checklist";

export default function Dashboard() {
  const steps: ChecklistStep[] = [
    {
      id: "welcome",
      title: "Welcome to the Platform",
      description: "Learn about the key features",
      completed: false,
      link: "/portal/start",
      estimatedMinutes: 5,
      badge: "Start Here",
    },
    {
      id: "setup",
      title: "Complete Setup",
      description: "Configure your workspace",
      completed: false,
      link: "/portal/setup",
      estimatedMinutes: 10,
    },
    {
      id: "first-automation",
      title: "Create First Automation",
      description: "Build your first workflow",
      completed: false,
      link: "/portal/seo",
      estimatedMinutes: 15,
    },
  ];

  return (
    <div>
      {/* Your dashboard content */}
      <OnboardingChecklist steps={steps} />
    </div>
  );
}
```

### Advanced Usage with State Management

```tsx
import { OnboardingChecklist } from "~/components/ui/onboarding-checklist";
import { useState } from "react";

export default function Dashboard() {
  const [showChecklist, setShowChecklist] = useState(true);

  const handleStepComplete = (stepId: string) => {
    // Track completion in analytics
    console.log(`Step completed: ${stepId}`);
    
    // You could also update backend
    fetch("/api/onboarding/complete", {
      method: "POST",
      body: JSON.stringify({ stepId }),
    });
  };

  const handleDismiss = () => {
    setShowChecklist(false);
    // Save preference
    localStorage.setItem("onboarding-dismissed", "true");
  };

  if (!showChecklist) return null;

  return (
    <OnboardingChecklist
      steps={steps}
      onStepComplete={handleStepComplete}
      onDismiss={handleDismiss}
      storageKey="my-app-onboarding"
    />
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `steps` | `ChecklistStep[]` | Required | Array of checklist steps |
| `onStepComplete` | `(stepId: string) => void` | - | Callback when step is completed |
| `onStepClick` | `(stepId: string) => void` | - | Callback when step is clicked |
| `onDismiss` | `() => void` | - | Callback to dismiss checklist |
| `storageKey` | `string` | `"onboarding-checklist"` | localStorage key for persistence |
| `className` | `string` | - | Additional CSS classes |

### ChecklistStep Interface

```typescript
interface ChecklistStep {
  id: string;                    // Unique identifier
  title: string;                 // Step title
  description: string;           // Step description
  completed: boolean;            // Completion status
  link?: string;                 // Optional navigation link
  estimatedMinutes?: number;     // Optional time estimate
  badge?: string;                // Optional badge text
}
```

---

## 3. Workflow Stepper

A multi-step workflow component with visual progress, validation, and draft saving.

### Features

- 📊 Visual step indicators
- ✅ Step validation
- 💾 Draft saving capability
- ⏱️ Time estimates
- 🔄 Step navigation
- 📱 Responsive (horizontal/vertical)
- 👁️ Preview of upcoming steps

### Installation

The component is at `app/components/ui/workflow-stepper.tsx`.

### Basic Usage

```tsx
import { WorkflowStepper, type WorkflowStep } from "~/components/ui/workflow-stepper";

export default function CreateAutomation() {
  const steps: WorkflowStep[] = [
    {
      id: "select-template",
      title: "Select Template",
      description: "Choose an automation template",
      estimatedMinutes: 2,
      content: (
        <div>
          {/* Your template selection UI */}
          <p>Select a template to get started...</p>
        </div>
      ),
    },
    {
      id: "configure",
      title: "Configure",
      description: "Set up your automation parameters",
      estimatedMinutes: 5,
      content: (
        <div>
          {/* Your configuration form */}
          <p>Configure your automation...</p>
        </div>
      ),
    },
    {
      id: "preview",
      title: "Preview",
      description: "Review your automation",
      estimatedMinutes: 2,
      content: (
        <div>
          {/* Preview UI */}
          <p>Preview your automation...</p>
        </div>
      ),
    },
  ];

  return <WorkflowStepper steps={steps} />;
}
```

### Advanced Usage with Validation

```tsx
import { WorkflowStepper } from "~/components/ui/workflow-stepper";
import { useState } from "react";

export default function CreateAutomation() {
  const [formData, setFormData] = useState({
    template: "",
    name: "",
    description: "",
  });

  const steps: WorkflowStep[] = [
    {
      id: "select-template",
      title: "Select Template",
      description: "Choose an automation template",
      estimatedMinutes: 2,
      content: (
        <div>
          <select
            value={formData.template}
            onChange={(e) => setFormData({ ...formData, template: e.target.value })}
          >
            <option value="">Select a template...</option>
            <option value="seo">SEO Automation</option>
            <option value="content">Content Generation</option>
          </select>
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
      title: "Configure",
      description: "Set up your automation parameters",
      estimatedMinutes: 5,
      content: (
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Automation name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
      ),
      validation: async () => {
        // Can be async for API validation
        return formData.name.length >= 3;
      },
    },
    {
      id: "review",
      title: "Review & Deploy",
      description: "Review and deploy your automation",
      estimatedMinutes: 2,
      content: (
        <div>
          <h3>Review Your Automation</h3>
          <p>Template: {formData.template}</p>
          <p>Name: {formData.name}</p>
          <p>Description: {formData.description}</p>
        </div>
      ),
    },
  ];

  const handleComplete = async () => {
    // Deploy automation
    console.log("Deploying automation:", formData);
    await fetch("/api/automations", {
      method: "POST",
      body: JSON.stringify(formData),
    });
  };

  const handleSaveDraft = (currentStep: number) => {
    localStorage.setItem(
      "automation-draft",
      JSON.stringify({ step: currentStep, data: formData })
    );
  };

  return (
    <WorkflowStepper
      steps={steps}
      onComplete={handleComplete}
      onSaveDraft={handleSaveDraft}
      savedStep={0}
      orientation="horizontal"
      allowStepNavigation={true}
    />
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `steps` | `WorkflowStep[]` | Required | Array of workflow steps |
| `currentStep` | `number` | - | Controlled current step index |
| `onStepChange` | `(stepIndex: number) => void` | - | Callback when step changes |
| `onComplete` | `() => void` | - | Callback when workflow completes |
| `onSaveDraft` | `(currentStep: number, data?: any) => void` | - | Callback to save draft |
| `savedStep` | `number` | `0` | Initial step to start from |
| `className` | `string` | - | Additional CSS classes |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | Layout orientation |
| `allowStepNavigation` | `boolean` | `true` | Allow clicking on steps to navigate |

### WorkflowStep Interface

```typescript
interface WorkflowStep {
  id: string;                                    // Unique identifier
  title: string;                                 // Step title
  description: string;                           // Step description
  content?: React.ReactNode;                     // Step content
  estimatedMinutes?: number;                     // Time estimate
  validation?: () => boolean | Promise<boolean>; // Validation function
  onComplete?: () => void | Promise<void>;       // Completion callback
}
```

---

## Integration Examples

### Example 1: Portal with All Components

```tsx
import { CommandPalette } from "~/components/ui/command-palette";
import { OnboardingChecklist } from "~/components/ui/onboarding-checklist";

export default function Portal() {
  const checklistSteps = [
    {
      id: "explore",
      title: "Explore the Portal",
      description: "Take a tour of available tools",
      completed: false,
      link: "/portal/start",
      estimatedMinutes: 5,
    },
    // ... more steps
  ];

  return (
    <div>
      <CommandPalette />
      <OnboardingChecklist steps={checklistSteps} />
      
      {/* Your portal content */}
      <main>
        <h1>Welcome to Your Portal</h1>
      </main>
    </div>
  );
}
```

### Example 2: Multi-Step Form with Workflow Stepper

```tsx
import { WorkflowStepper } from "~/components/ui/workflow-stepper";

export default function SetupWizard() {
  const steps = [
    {
      id: "account",
      title: "Account Info",
      description: "Set up your account details",
      content: <AccountForm />,
      validation: () => validateAccount(),
    },
    {
      id: "preferences",
      title: "Preferences",
      description: "Configure your preferences",
      content: <PreferencesForm />,
    },
    {
      id: "complete",
      title: "Complete",
      description: "You're all set!",
      content: <CompletionMessage />,
    },
  ];

  return <WorkflowStepper steps={steps} />;
}
```

---

## Best Practices

### Command Palette

1. **Keep actions organized**: Group related actions in meaningful categories
2. **Use descriptive labels**: Make actions easy to find with clear names
3. **Add keywords**: Include synonyms and related terms for better search
4. **Track usage**: Monitor which actions are used most to optimize the palette

### Onboarding Checklist

1. **Start simple**: Begin with 3-5 essential steps
2. **Be specific**: Use clear, actionable step titles
3. **Provide estimates**: Help users plan their time
4. **Celebrate wins**: Let the confetti fly on completions!
5. **Allow dismissal**: Give users control over when they see it

### Workflow Stepper

1. **Validate early**: Check inputs before allowing progression
2. **Save drafts**: Don't lose user progress
3. **Show progress**: Keep users informed of their position
4. **Preview ahead**: Show what's coming next
5. **Handle errors gracefully**: Provide clear error messages

---

## Styling and Customization

All components use your existing design system (shadcn/ui) and can be customized via:

1. **Tailwind classes**: Pass `className` prop
2. **CSS variables**: Modify theme colors
3. **Component props**: Adjust behavior and appearance

Example custom styling:

```tsx
<OnboardingChecklist
  className="bottom-20 right-20 w-[500px]"
  steps={steps}
/>
```

---

## Troubleshooting

### Command Palette not opening

- Ensure the component is rendered in your app
- Check that keyboard events aren't being blocked
- Verify `Cmd/Ctrl + K` isn't bound elsewhere

### Onboarding Checklist state not persisting

- Check localStorage is available
- Verify `storageKey` is unique
- Clear localStorage if testing: `localStorage.clear()`

### Workflow Stepper validation not working

- Ensure validation function returns boolean or Promise<boolean>
- Check for async/await issues
- Add error logging to validation functions

---

## Support

For issues or questions:
1. Check this documentation
2. Review component source code
3. Test with provided examples
4. Check browser console for errors

Happy building! 🚀

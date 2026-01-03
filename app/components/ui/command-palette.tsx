"use client";

import * as React from "react";
import { useNavigate } from "react-router";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "~/components/ui/command";
import {
  Home,
  Settings,
  FileText,
  Search,
  Download,
  HelpCircle,
  Sparkles,
  LayoutDashboard,
  CreditCard,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { cn } from "~/lib/utils";

interface CommandAction {
  id: string;
  label: string;
  description?: string;
  icon?: LucideIcon;
  shortcut?: string;
  action: () => void;
  category: string;
  keywords?: string[];
}

interface CommandPaletteProps {
  actions?: CommandAction[];
  recentActions?: string[];
  onActionExecute?: (actionId: string) => void;
}

export function CommandPalette({
  actions: customActions,
  recentActions = [],
  onActionExecute,
}: CommandPaletteProps) {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();

  // Default actions
  const defaultActions: CommandAction[] = [
    {
      id: "home",
      label: "Go to Home",
      description: "Navigate to the home page",
      icon: Home,
      shortcut: "⌘H",
      action: () => navigate("/"),
      category: "Navigation",
      keywords: ["home", "main", "start"],
    },
    {
      id: "dashboard",
      label: "Go to Dashboard",
      description: "View your dashboard",
      icon: LayoutDashboard,
      shortcut: "⌘D",
      action: () => navigate("/dashboard"),
      category: "Navigation",
      keywords: ["dashboard", "overview"],
    },
    {
      id: "portal",
      label: "Go to Portal",
      description: "Access your private workspace",
      icon: Sparkles,
      shortcut: "⌘P",
      action: () => navigate("/portal"),
      category: "Navigation",
      keywords: ["portal", "workspace", "tools"],
    },
    {
      id: "portal-start",
      label: "Portal: Start Here",
      description: "Get oriented and pick your first workflow",
      icon: FileText,
      action: () => navigate("/portal/start"),
      category: "Portal",
      keywords: ["start", "begin", "getting started"],
    },
    {
      id: "portal-setup",
      label: "Portal: Setup",
      description: "Apply prompts and templates to your tools",
      icon: Settings,
      action: () => navigate("/portal/setup"),
      category: "Portal",
      keywords: ["setup", "configure", "install"],
    },
    {
      id: "portal-seo",
      label: "Portal: SEO Tools",
      description: "Generate keywords, briefs, and improvements",
      icon: Search,
      action: () => navigate("/portal/seo"),
      category: "Portal",
      keywords: ["seo", "keywords", "optimization"],
    },
    {
      id: "portal-troubleshooting",
      label: "Portal: Troubleshooting",
      description: "Fix common issues quickly",
      icon: HelpCircle,
      action: () => navigate("/portal/troubleshooting"),
      category: "Portal",
      keywords: ["help", "troubleshoot", "fix", "issues"],
    },
    {
      id: "downloads",
      label: "Portal: Downloads",
      description: "Access downloadable resources",
      icon: Download,
      action: () => navigate("/portal/downloads"),
      category: "Portal",
      keywords: ["downloads", "resources", "files"],
    },
    {
      id: "checkout",
      label: "Go to Checkout",
      description: "Purchase or upgrade your plan",
      icon: CreditCard,
      action: () => navigate("/checkout"),
      category: "Account",
      keywords: ["checkout", "buy", "purchase", "upgrade"],
    },
  ];

  const allActions = customActions || defaultActions;

  // Keyboard shortcut handler
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleActionSelect = (action: CommandAction) => {
    setOpen(false);
    action.action();
    if (onActionExecute) {
      onActionExecute(action.id);
    }
  };

  // Group actions by category
  const groupedActions = allActions.reduce(
    (acc, action) => {
      if (!acc[action.category]) {
        acc[action.category] = [];
      }
      acc[action.category].push(action);
      return acc;
    },
    {} as Record<string, CommandAction[]>
  );

  // Get recent actions
  const recentActionItems = recentActions
    .map((id) => allActions.find((a) => a.id === id))
    .filter(Boolean) as CommandAction[];

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {recentActionItems.length > 0 && (
            <>
              <CommandGroup heading="Recent">
                {recentActionItems.map((action) => {
                  const Icon = action.icon;
                  return (
                    <CommandItem
                      key={action.id}
                      onSelect={() => handleActionSelect(action)}
                      className="flex items-center gap-2"
                    >
                      {Icon && <Icon className="h-4 w-4" />}
                      <div className="flex-1">
                        <div className="font-medium">{action.label}</div>
                        {action.description && (
                          <div className="text-xs text-muted-foreground">
                            {action.description}
                          </div>
                        )}
                      </div>
                      {action.shortcut && (
                        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                          {action.shortcut}
                        </kbd>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {Object.entries(groupedActions).map(([category, actions]) => (
            <React.Fragment key={category}>
              <CommandGroup heading={category}>
                {actions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <CommandItem
                      key={action.id}
                      onSelect={() => handleActionSelect(action)}
                      className="flex items-center gap-2"
                      keywords={action.keywords}
                    >
                      {Icon && <Icon className="h-4 w-4" />}
                      <div className="flex-1">
                        <div className="font-medium">{action.label}</div>
                        {action.description && (
                          <div className="text-xs text-muted-foreground">
                            {action.description}
                          </div>
                        )}
                      </div>
                      {action.shortcut && (
                        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                          {action.shortcut}
                        </kbd>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              <CommandSeparator />
            </React.Fragment>
          ))}
        </CommandList>
      </CommandDialog>

      {/* Hint for users */}
      <div className="fixed bottom-4 right-4 z-40 hidden sm:block">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm shadow-sm transition-all hover:shadow-md"
        >
          <span className="text-muted-foreground">Press</span>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
          <span className="text-muted-foreground">to search</span>
        </button>
      </div>
    </>
  );
}

export type { CommandAction };

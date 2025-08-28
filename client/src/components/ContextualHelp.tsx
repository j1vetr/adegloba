import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle, Info } from "lucide-react";

interface ContextualHelpProps {
  content: string;
  children?: React.ReactNode;
  variant?: "icon" | "inline";
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export function ContextualHelp({ 
  content, 
  children, 
  variant = "icon", 
  side = "top",
  className = ""
}: ContextualHelpProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {children ? (
          <span className={`cursor-help ${className}`}>
            {children}
          </span>
        ) : (
          <button 
            className={`inline-flex items-center justify-center text-slate-400 hover:text-blue-400 transition-colors duration-200 ${className}`}
            data-testid="contextual-help-trigger"
          >
            {variant === "icon" ? (
              <HelpCircle className="h-4 w-4" />
            ) : (
              <Info className="h-4 w-4" />
            )}
          </button>
        )}
      </TooltipTrigger>
      <TooltipContent 
        side={side}
        className="max-w-xs bg-slate-800/95 border-slate-600 text-white shadow-xl backdrop-blur-sm"
        data-testid="contextual-help-content"
      >
        <p className="text-sm leading-relaxed">{content}</p>
      </TooltipContent>
    </Tooltip>
  );
}

// Specialized tooltip for form fields
export function FormFieldHelp({ content, className = "" }: { content: string; className?: string }) {
  return (
    <ContextualHelp 
      content={content}
      variant="icon"
      side="right"
      className={`ml-1 ${className}`}
    />
  );
}

// Specialized tooltip for navigation items
export function NavigationHelp({ content, children }: { content: string; children: React.ReactNode }) {
  return (
    <ContextualHelp 
      content={content}
      side="bottom"
    >
      {children}
    </ContextualHelp>
  );
}

// Specialized tooltip for feature explanations
export function FeatureHelp({ content, children }: { content: string; children: React.ReactNode }) {
  return (
    <ContextualHelp 
      content={content}
      side="top"
    >
      {children}
    </ContextualHelp>
  );
}
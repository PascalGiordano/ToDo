
import React from 'react';
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { LucideProps, IconNode } from 'lucide-react';
import { icons as lucideIconManifest, createLucideIcon as createLucideIconPrimitive, HelpCircle, AlertTriangle } from 'lucide-react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const kebabToPascalCase = (str: string): string => {
  if (!str || typeof str !== 'string') return '';
  return str.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
};

const pascalToKebabCase = (str: string): string => {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();
};

export const renderIcon = (
  iconName?: string,
  passThroughProps: LucideProps = {}
): React.ReactElement | null => {
  if (!iconName || typeof iconName !== 'string' || iconName.trim() === '') {
    console.warn("renderIcon: No iconName provided or invalid. Rendering fallback '?' div.");
    const fallbackDivProps: React.HTMLAttributes<HTMLDivElement> & { title?: string } = {
      className: cn("inline-flex items-center justify-center font-bold text-destructive border border-dashed border-destructive rounded-sm", passThroughProps.className),
      style: { 
        width: typeof passThroughProps.size === 'number' ? `${passThroughProps.size}px` : '16px', 
        height: typeof passThroughProps.size === 'number' ? `${passThroughProps.size}px` : '16px', 
        fontSize: typeof passThroughProps.size === 'number' ? `${Math.max(10, passThroughProps.size / 1.8)}px` : '10px',
      },
      title: "Icon name invalid or missing"
    };
    return React.createElement('div', fallbackDivProps, '?');
  }

  // Assume iconName is already PascalCase as per IconPicker's output
  const normalizedPascalName = iconName.trim();
  const normalizedKebabName = pascalToKebabCase(normalizedPascalName);

  const propsToApply: LucideProps = {
    size: 16,
    strokeWidth: 2,
    ...passThroughProps,
    className: cn("inline-block", passThroughProps.className), // Default color will be currentColor from CSS
  };
  if (passThroughProps.color === undefined || passThroughProps.color === '') {
     delete propsToApply.color; // Let CSS handle color if not explicitly passed
  }


  const iconNode = lucideIconManifest[normalizedKebabName as keyof typeof lucideIconManifest] as IconNode | undefined;

  if (!iconNode) {
    console.warn(`renderIcon: Icon "${normalizedPascalName}" (kebab: "${normalizedKebabName}") not found in lucideIconManifest. Rendering HelpCircle.`);
    return React.createElement(HelpCircle, { ...propsToApply, title: `Unknown icon: ${normalizedPascalName}` });
  }

  try {
    const IconComponent = createLucideIconPrimitive(normalizedPascalName, iconNode);
    return React.createElement(IconComponent, propsToApply);
  } catch (creationError) {
    console.error(`renderIcon: Error creating Lucide icon "${normalizedPascalName}" (kebab: "${normalizedKebabName}"):`, creationError, "Props:", propsToApply);
    return React.createElement(AlertTriangle, { ...propsToApply, title: `Error rendering icon: ${normalizedPascalName}`, color: propsToApply.color || "hsl(var(--destructive))" });
  }
};

export const getInitials = (name?: string): string => {
  if (!name || typeof name !== 'string') {
    return '';
  }
  const trimmedName = name.trim();
  if (trimmedName === '') {
    return '';
  }
  const words = trimmedName.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return '';
  }
  if (words.length === 1) {
    const firstChar = words[0].charAt(0);
    const secondChar = words[0].length > 1 ? words[0].charAt(1) : '';
    
    const firstInitial = firstChar.match(/[a-zA-ZÀ-ÿ]/) ? firstChar.toUpperCase() : firstChar;
    const secondInitialMatch = secondChar.match(/[a-zA-ZÀ-ÿ]/);
    let secondInitial = '';
    if (secondInitialMatch) {
      secondInitial = secondChar.toUpperCase() !== firstInitial.toUpperCase() ? secondChar.toUpperCase() : (words[0].length > 1 && words[0].charAt(1) !== firstChar ? words[0].charAt(1).toUpperCase() : '');
    } else {
      secondInitial = secondChar;
    }
    return `${firstInitial}${secondInitial}`.substring(0,2);
  }
  return words
    .slice(0, 2)
    .map(word => (word[0].match(/[a-zA-ZÀ-ÿ]/) ? word[0].toUpperCase() : word[0]))
    .join('');
};

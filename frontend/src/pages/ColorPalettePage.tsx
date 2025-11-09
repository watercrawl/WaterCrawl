import React from 'react';

import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';

import { useTheme } from '../contexts/ThemeContext';

interface ColorItem {
  name: string;
  className: string;
  description: string;
}

const colorGroups = [
  {
    title: 'Background Colors',
    colors: [
      { name: 'Background', className: 'bg-background', description: 'Page background' },
      { name: 'Foreground', className: 'text-foreground', description: 'Primary text' },
      { name: 'Card', className: 'bg-card', description: 'Card background' },
      { name: 'Card Foreground', className: 'text-card-foreground', description: 'Card text' },
      { name: 'Muted', className: 'bg-muted', description: 'Muted backgrounds' },
      { name: 'Muted Foreground', className: 'text-muted-foreground', description: 'Muted text' },
    ],
  },
  {
    title: 'Brand Colors',
    colors: [
      { name: 'Primary', className: 'bg-primary', description: 'Primary brand color' },
      {
        name: 'Primary Foreground',
        className: 'text-primary-foreground',
        description: 'Text on primary',
      },
      { name: 'Primary Hover', className: 'bg-primary-hover', description: 'Primary hover state' },
      {
        name: 'Primary Soft',
        className: 'bg-primary-soft',
        description: 'Primary soft variant',
      },
      { name: 'Primary Strong', className: 'text-primary-strong', description: 'Primary strong variant' },
    ],
  },
  {
    title: 'Secondary Colors',
    colors: [
      { name: 'Secondary', className: 'bg-secondary', description: 'Secondary brand color' },
      {
        name: 'Secondary Foreground',
        className: 'text-secondary-foreground',
        description: 'Text on secondary',
      },
      {
        name: 'Secondary Hover',
        className: 'bg-secondary-hover',
        description: 'Secondary hover state',
      },
      {
        name: 'Secondary Soft',
        className: 'bg-secondary-soft',
        description: 'Secondary soft variant',
      },
      {
        name: 'Secondary Strong',
        className: 'text-secondary-strong',
        description: 'Secondary strong variant',
      },
    ],
  },
  {
    title: 'Tertiary Colors',
    colors: [
      { name: 'Tertiary', className: 'bg-tertiary', description: 'Tertiary brand color' },
      {
        name: 'Tertiary Foreground',
        className: 'text-tertiary-foreground',
        description: 'Text on tertiary',
      },
      {
        name: 'Tertiary Hover',
        className: 'bg-tertiary-hover',
        description: 'Tertiary hover state',
      },
      {
        name: 'Tertiary Soft',
        className: 'bg-tertiary-soft',
        description: 'Tertiary soft variant',
      },
      {
        name: 'Tertiary Strong',
        className: 'text-tertiary-strong',
        description: 'Tertiary strong variant',
      },
    ],
  },
  {
    title: 'Status Colors - Success',
    colors: [
      { name: 'Success', className: 'bg-success', description: 'Success state' },
      {
        name: 'Success Foreground',
        className: 'text-success-foreground',
        description: 'Text on success',
      },
      {
        name: 'Success Soft',
        className: 'bg-success-soft',
        description: 'Success soft variant',
      },
      { name: 'Success Strong', className: 'text-success-strong', description: 'Success strong variant' },
    ],
  },
  {
    title: 'Status Colors - Error',
    colors: [
      { name: 'Error', className: 'bg-error', description: 'Error state' },
      {
        name: 'Error Foreground',
        className: 'text-error-foreground',
        description: 'Text on error',
      },
      { name: 'Error Soft', className: 'bg-error-soft', description: 'Error soft variant' },
      { name: 'Error Strong', className: 'text-error-strong', description: 'Error strong variant' },
    ],
  },
  {
    title: 'Status Colors - Warning',
    colors: [
      { name: 'Warning', className: 'bg-warning', description: 'Warning state' },
      {
        name: 'Warning Foreground',
        className: 'text-warning-foreground',
        description: 'Text on warning',
      },
      {
        name: 'Warning Soft',
        className: 'bg-warning-soft',
        description: 'Warning soft variant',
      },
      { name: 'Warning Strong', className: 'text-warning-strong', description: 'Warning strong variant' },
    ],
  },
  {
    title: 'Status Colors - Info',
    colors: [
      { name: 'Info', className: 'bg-info', description: 'Info state' },
      { name: 'Info Foreground', className: 'text-info-foreground', description: 'Text on info' },
      { name: 'Info Soft', className: 'bg-info-soft', description: 'Info soft variant' },
      { name: 'Info Strong', className: 'text-info-strong', description: 'Info strong variant' },
    ],
  },
  {
    title: 'Border Colors',
    colors: [
      { name: 'Border', className: 'border-border', description: 'Default borders' },
      { name: 'Input Border', className: 'border-input-border', description: 'Input borders' },
    ],
  },
  {
    title: 'Input/Form Colors',
    colors: [
      { name: 'Input', className: 'bg-input', description: 'Input background' },
      { name: 'Ring', className: 'ring-ring', description: 'Focus ring' },
    ],
  },
  {
    title: 'Sidebar Colors',
    colors: [
      { name: 'Sidebar Background', className: 'bg-sidebar-bg', description: 'Sidebar background' },
      { name: 'Sidebar Text', className: 'text-sidebar-text', description: 'Sidebar text' },
      {
        name: 'Sidebar Text Muted',
        className: 'text-sidebar-text-muted',
        description: 'Sidebar muted text',
      },
      {
        name: 'Sidebar Active BG',
        className: 'bg-sidebar-active-bg',
        description: 'Sidebar active background',
      },
      {
        name: 'Sidebar Active Text',
        className: 'text-sidebar-active-text',
        description: 'Sidebar active text',
      },
      {
        name: 'Sidebar Hover BG',
        className: 'bg-sidebar-hover-bg',
        description: 'Sidebar hover background',
      },
      { name: 'Sidebar Border', className: 'border-sidebar-border', description: 'Sidebar border' },
    ],
  },
];

const ColorSwatch: React.FC<ColorItem> = ({ name, className, description }) => {
  // Extract CSS variable from Tailwind className
  const getCSSVarFromClassName = (cls: string): string => {
    // Remove prefix (bg-, text-, border-, ring-) to get the variable name
    const varName = cls.replace(/^(bg-|text-|border-|ring-)/, '');
    return `--${varName}`;
  };

  const getCSSValue = (varName: string) => {
    const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    return value ? `rgb(${value})` : 'transparent';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const cssVar = getCSSVarFromClassName(className);
  const rgbValue = getCSSValue(cssVar);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
      <div
        className="h-16 w-full rounded-md border border-border shadow-sm"
        style={{ backgroundColor: rgbValue }}
      />
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">{name}</h3>
          <button
            onClick={() => copyToClipboard(className)}
            className="rounded px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Copy Tailwind class"
          >
            Copy
          </button>
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
        <code className="block text-[10px] text-muted-foreground">{className}</code>
        <code className="block text-[10px] text-muted-foreground">{cssVar}</code>
        <code className="block text-[10px] text-muted-foreground">{rgbValue}</code>
      </div>
    </div>
  );
};

export const ColorPalettePage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);

  // Force re-render when theme changes to update CSS variable values
  React.useEffect(() => {
    // Small delay to ensure CSS has been applied
    const timer = setTimeout(() => {
      forceUpdate();
    }, 100);
    return () => clearTimeout(timer);
  }, [theme]);

  const themeOptions = [
    { value: 'light' as const, label: 'Light', icon: SunIcon },
    { value: 'dark' as const, label: 'Dark', icon: MoonIcon },
    { value: 'system' as const, label: 'System', icon: ComputerDesktopIcon },
  ];

  const mainColors = [
    { name: 'Primary', className: 'bg-primary', description: 'Primary brand color' },
    { name: 'Secondary', className: 'bg-secondary', description: 'Secondary brand color' },
    { name: 'Tertiary', className: 'bg-tertiary', description: 'Tertiary brand color' },
    { name: 'Success', className: 'bg-success', description: 'Success state' },
    { name: 'Error', className: 'bg-error', description: 'Error state' },
    { name: 'Warning', className: 'bg-warning', description: 'Warning state' },
    { name: 'Info', className: 'bg-info', description: 'Info state' },
  ];

  const getCSSVarFromClassName = (cls: string): string => {
    const varName = cls.replace(/^(bg-|text-|border-|ring-)/, '');
    return `--${varName}`;
  };

  const getCSSValue = (varName: string) => {
    const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    return value ? `rgb(${value})` : 'transparent';
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="sticky top-10 z-50 mb-8 flex items-center justify-between rounded-lg border border-border bg-background p-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">WaterCrawl Color Palette</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Complete design system color tokens with light and dark mode support
            </p>
          </div>

          {/* Theme Switcher */}
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-1">
            {themeOptions.map(option => {
              const Icon = option.icon;
              const isActive = theme === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Colors Overview */}
        <div className="mb-12 rounded-lg border border-border bg-card p-6">
          <h2 className="mb-6 text-2xl font-bold text-foreground">Main Colors</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
            {mainColors.map(color => {
              const cssVar = getCSSVarFromClassName(color.className);
              const rgbValue = getCSSValue(cssVar);
              return (
                <button
                  key={color.className}
                  onClick={() => scrollToSection(cssVar)}
                  className="group flex flex-col items-center gap-3 rounded-lg border border-border bg-background p-4 transition-all hover:border-primary hover:shadow-md"
                >
                  <div
                    className="h-20 w-20 rounded-full border-2 border-border shadow-sm transition-transform group-hover:scale-110"
                    style={{ backgroundColor: rgbValue }}
                  />
                  <div className="text-center">
                    <h3 className="text-sm font-semibold text-foreground">{color.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{color.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detailed Color Groups */}
        <div className="space-y-12">
          {colorGroups.map(group => {
            const firstColor = group.colors[0];
            const sectionId = firstColor
              ? getCSSVarFromClassName(firstColor.className)
              : group.title;
            return (
              <div key={group.title} id={sectionId} className="scroll-mt-8">
                <div className="mb-6 flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-foreground">{group.title}</h2>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                    {group.colors.length} colors
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {group.colors.map(color => (
                    <ColorSwatch key={color.className} {...color} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="mt-16 rounded-lg border border-border bg-card p-6">
          <h3 className="mb-4 text-lg font-bold text-foreground">Usage Guidelines</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Tailwind CSS</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>
                  <code className="rounded bg-muted px-2 py-1 text-xs">bg-primary</code> Background
                  color
                </p>
                <p>
                  <code className="rounded bg-muted px-2 py-1 text-xs">text-foreground</code> Text
                  color
                </p>
                <p>
                  <code className="rounded bg-muted px-2 py-1 text-xs">border-border</code> Border
                  color
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Direct CSS</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>
                  <code className="rounded bg-muted px-2 py-1 text-xs">
                    rgb(var(--primary) / 1)
                  </code>{' '}
                  Solid color
                </p>
                <p>
                  <code className="rounded bg-muted px-2 py-1 text-xs">
                    rgb(var(--primary) / 0.5)
                  </code>{' '}
                  With opacity
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorPalettePage;

import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';

interface ColorItem {
  name: string;
  cssVar: string;
  description: string;
}

const colorGroups = [
  {
    title: 'Background Colors',
    colors: [
      { name: 'Background', cssVar: '--background', description: 'Page background' },
      { name: 'Foreground', cssVar: '--foreground', description: 'Primary text' },
      { name: 'Card', cssVar: '--card', description: 'Card background' },
      { name: 'Card Foreground', cssVar: '--card-foreground', description: 'Card text' },
      { name: 'Muted', cssVar: '--muted', description: 'Muted backgrounds' },
      { name: 'Muted Foreground', cssVar: '--muted-foreground', description: 'Muted text' },
    ],
  },
  {
    title: 'Brand Colors',
    colors: [
      { name: 'Primary', cssVar: '--primary', description: 'Primary brand color' },
      { name: 'Primary Foreground', cssVar: '--primary-foreground', description: 'Text on primary' },
      { name: 'Primary Hover', cssVar: '--primary-hover', description: 'Primary hover state' },
      { name: 'Primary Light', cssVar: '--primary-light', description: 'Primary light variant' },
      { name: 'Primary Dark', cssVar: '--primary-dark', description: 'Primary dark variant' },
    ],
  },
  {
    title: 'Secondary Colors',
    colors: [
      { name: 'Secondary', cssVar: '--secondary', description: 'Secondary brand color' },
      { name: 'Secondary Foreground', cssVar: '--secondary-foreground', description: 'Text on secondary' },
      { name: 'Secondary Hover', cssVar: '--secondary-hover', description: 'Secondary hover state' },
      { name: 'Secondary Light', cssVar: '--secondary-light', description: 'Secondary light variant' },
      { name: 'Secondary Dark', cssVar: '--secondary-dark', description: 'Secondary dark variant' },
    ],
  },
  {
    title: 'Tertiary Colors',
    colors: [
      { name: 'Tertiary', cssVar: '--tertiary', description: 'Tertiary brand color' },
      { name: 'Tertiary Foreground', cssVar: '--tertiary-foreground', description: 'Text on tertiary' },
      { name: 'Tertiary Hover', cssVar: '--tertiary-hover', description: 'Tertiary hover state' },
      { name: 'Tertiary Light', cssVar: '--tertiary-light', description: 'Tertiary light variant' },
      { name: 'Tertiary Dark', cssVar: '--tertiary-dark', description: 'Tertiary dark variant' },
    ],
  },
  {
    title: 'Status Colors - Success',
    colors: [
      { name: 'Success', cssVar: '--success', description: 'Success state' },
      { name: 'Success Foreground', cssVar: '--success-foreground', description: 'Text on success' },
      { name: 'Success Light', cssVar: '--success-light', description: 'Success light variant' },
      { name: 'Success Dark', cssVar: '--success-dark', description: 'Success dark variant' },
    ],
  },
  {
    title: 'Status Colors - Error',
    colors: [
      { name: 'Error', cssVar: '--error', description: 'Error state' },
      { name: 'Error Foreground', cssVar: '--error-foreground', description: 'Text on error' },
      { name: 'Error Light', cssVar: '--error-light', description: 'Error light variant' },
      { name: 'Error Dark', cssVar: '--error-dark', description: 'Error dark variant' },
    ],
  },
  {
    title: 'Status Colors - Warning',
    colors: [
      { name: 'Warning', cssVar: '--warning', description: 'Warning state' },
      { name: 'Warning Foreground', cssVar: '--warning-foreground', description: 'Text on warning' },
      { name: 'Warning Light', cssVar: '--warning-light', description: 'Warning light variant' },
      { name: 'Warning Dark', cssVar: '--warning-dark', description: 'Warning dark variant' },
    ],
  },
  {
    title: 'Status Colors - Info',
    colors: [
      { name: 'Info', cssVar: '--info', description: 'Info state' },
      { name: 'Info Foreground', cssVar: '--info-foreground', description: 'Text on info' },
      { name: 'Info Light', cssVar: '--info-light', description: 'Info light variant' },
      { name: 'Info Dark', cssVar: '--info-dark', description: 'Info dark variant' },
    ],
  },
  {
    title: 'Border Colors',
    colors: [
      { name: 'Border', cssVar: '--border', description: 'Default borders' },
      { name: 'Input Border', cssVar: '--input-border', description: 'Input borders' },
      { name: 'Card Border', cssVar: '--card-border', description: 'Card borders' },
    ],
  },
  {
    title: 'Link Colors',
    colors: [
      { name: 'Link', cssVar: '--text-link', description: 'Link color' },
      { name: 'Link Hover', cssVar: '--text-link-hover', description: 'Link hover state' },
    ],
  },
  {
    title: 'Input/Form Colors',
    colors: [
      { name: 'Input', cssVar: '--input', description: 'Input background' },
      { name: 'Ring', cssVar: '--ring', description: 'Focus ring' },
    ],
  },
  {
    title: 'Sidebar Colors',
    colors: [
      { name: 'Sidebar Background', cssVar: '--sidebar-bg', description: 'Sidebar background' },
      { name: 'Sidebar Text', cssVar: '--sidebar-text', description: 'Sidebar text' },
      { name: 'Sidebar Text Muted', cssVar: '--sidebar-text-muted', description: 'Sidebar muted text' },
      { name: 'Sidebar Active BG', cssVar: '--sidebar-active-bg', description: 'Sidebar active background' },
      { name: 'Sidebar Active Text', cssVar: '--sidebar-active-text', description: 'Sidebar active text' },
      { name: 'Sidebar Hover BG', cssVar: '--sidebar-hover-bg', description: 'Sidebar hover background' },
      { name: 'Sidebar Border', cssVar: '--sidebar-border', description: 'Sidebar border' },
    ],
  },
  {
    title: 'Alert Colors - Info',
    colors: [
      { name: 'Alert Info BG', cssVar: '--alert-info-bg', description: 'Info alert background' },
      { name: 'Alert Info Border', cssVar: '--alert-info-border', description: 'Info alert border' },
      { name: 'Alert Info Text', cssVar: '--alert-info-text', description: 'Info alert text' },
      { name: 'Alert Info Icon', cssVar: '--alert-info-icon', description: 'Info alert icon' },
    ],
  },
  {
    title: 'Alert Colors - Success',
    colors: [
      { name: 'Alert Success BG', cssVar: '--alert-success-bg', description: 'Success alert background' },
      { name: 'Alert Success Border', cssVar: '--alert-success-border', description: 'Success alert border' },
      { name: 'Alert Success Text', cssVar: '--alert-success-text', description: 'Success alert text' },
      { name: 'Alert Success Icon', cssVar: '--alert-success-icon', description: 'Success alert icon' },
    ],
  },
  {
    title: 'Alert Colors - Warning',
    colors: [
      { name: 'Alert Warning BG', cssVar: '--alert-warning-bg', description: 'Warning alert background' },
      { name: 'Alert Warning Border', cssVar: '--alert-warning-border', description: 'Warning alert border' },
      { name: 'Alert Warning Text', cssVar: '--alert-warning-text', description: 'Warning alert text' },
      { name: 'Alert Warning Icon', cssVar: '--alert-warning-icon', description: 'Warning alert icon' },
    ],
  },
  {
    title: 'Alert Colors - Error',
    colors: [
      { name: 'Alert Error BG', cssVar: '--alert-error-bg', description: 'Error alert background' },
      { name: 'Alert Error Border', cssVar: '--alert-error-border', description: 'Error alert border' },
      { name: 'Alert Error Text', cssVar: '--alert-error-text', description: 'Error alert text' },
      { name: 'Alert Error Icon', cssVar: '--alert-error-icon', description: 'Error alert icon' },
    ],
  },
];

const ColorSwatch: React.FC<ColorItem> = ({ name, cssVar, description }) => {
  const getCSSValue = (varName: string) => {
    const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    return value ? `rgb(${value})` : 'transparent';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

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
            onClick={() => copyToClipboard(cssVar)}
            className="rounded px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Copy CSS variable"
          >
            Copy
          </button>
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
        <code className="block text-[10px] text-muted-foreground">{cssVar}</code>
        <code className="block text-[10px] text-muted-foreground">{rgbValue}</code>
      </div>
    </div>
  );
};

export const ColorPalettePage: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const themeOptions = [
    { value: 'light' as const, label: 'Light', icon: SunIcon },
    { value: 'dark' as const, label: 'Dark', icon: MoonIcon },
    { value: 'system' as const, label: 'System', icon: ComputerDesktopIcon },
  ];

  const mainColors = [
    { name: 'Primary', cssVar: '--primary', description: 'Primary brand color' },
    { name: 'Secondary', cssVar: '--secondary', description: 'Secondary brand color' },
    { name: 'Tertiary', cssVar: '--tertiary', description: 'Tertiary brand color' },
    { name: 'Success', cssVar: '--success', description: 'Success state' },
    { name: 'Error', cssVar: '--error', description: 'Error state' },
    { name: 'Warning', cssVar: '--warning', description: 'Warning state' },
    { name: 'Info', cssVar: '--info', description: 'Info state' },
  ];

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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">WaterCrawl Color Palette</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Complete design system color tokens with light and dark mode support
            </p>
          </div>

          {/* Theme Switcher */}
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-1">
            {themeOptions.map((option) => {
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
            {mainColors.map((color) => {
              const rgbValue = getCSSValue(color.cssVar);
              return (
                <button
                  key={color.cssVar}
                  onClick={() => scrollToSection(color.cssVar)}
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
          {colorGroups.map((group) => (
            <div key={group.title} id={group.colors[0]?.cssVar} className="scroll-mt-8">
              <div className="mb-6 flex items-center gap-3">
                <h2 className="text-2xl font-bold text-foreground">{group.title}</h2>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                  {group.colors.length} colors
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {group.colors.map((color) => (
                  <ColorSwatch key={color.cssVar} {...color} />
                ))}
              </div>
            </div>
          ))}
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

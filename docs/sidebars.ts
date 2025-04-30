import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

const shared = {
  topLinks: [

  ],
  bottomLinks: [
    {
      type: 'link' as const,
      label: 'Website',
      href: 'https://watercrawl.dev/', 
    },
    {
      type: 'link' as const,
      label: 'GitHub',
      href: 'https://github.com/watercrawl/watercrawl',
    },
  ],
}

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    ...shared.topLinks,
    'intro',
    {
      type: 'category',
      label: 'Documents',
      items: [
        'api/overview',
        'api/scrape-url',
        'api/create-crawl',
        'api/list-crawls',
        'api/get-crawl',
        'api/monitor-crawl',
        'api/cancel-crawl',
        'api/list-results',
        'api/create-search',
        'api/monitor-search',
        'api/get-search',
        'api/cancel-search',
      ],
    },
    {
      type: 'category',
      label: 'Self Hosted',
      items: [
        {
          type: 'doc',
          id: 'self-hosted/overview',
        },
        {
          type: 'doc',
          id: 'self-hosted/installation',
        },
        {
          type: 'doc',
          id: 'self-hosted/configuration',
        },
        {
          type: 'doc',
          id: 'self-hosted/services',
        },
        {
          type: 'doc',
          id: 'self-hosted/troubleshooting',
        },
        {
          type: 'link',
          label: 'GitHub',
          href: 'https://github.com/watercrawl/self-hosted',
        },
      ],
    },
    ...shared.bottomLinks
  ],
  clientSidebar: [
    ...shared.topLinks,
    'clients/intro',
    {
      'type': 'doc',
      'id': 'clients/python',
    },
    {
      'type': 'doc',
      'id': 'clients/nodejs',
    },
    {
      'type': 'doc',
      'id': 'clients/rust',
    },
    {
      'type': 'doc',
      'id': 'clients/go',
    },
    {
      'type': 'doc',
      'id': 'clients/php',
    },
    ...shared.bottomLinks
  ],
};

export default sidebars;

'use client';

import * as React from 'react';
import { Check, Copy } from 'lucide-react';
import { createRoot } from 'react-dom/client';
import { cn } from '@/lib/utils';
import mediumZoom from 'medium-zoom';
import { LinkPreview } from '@/shared/components/common/link-preview';

export function ArticleContent({ html, className }: { html: string; className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!ref.current) return;

    // Initialize medium-zoom
    const zoom = mediumZoom(ref.current.querySelectorAll('img'), {
      background: 'rgba(0, 0, 0, 0.8)',
      margin: 24,
    });

    // Process links for preview
    const links = ref.current.querySelectorAll('a');
    links.forEach((link) => {
      if (link.dataset.processed) return;
      
      const href = link.getAttribute('href');
      if (!href || href.startsWith('/') || href.startsWith('#')) return;

      link.dataset.processed = 'true';
      
      // Create a container for the React component
      const container = document.createElement('span');
      link.parentNode?.insertBefore(container, link);
      
      // Get the content and attributes
      const content = link.innerHTML;
      const classes = link.className;
      
      // Remove the original link
      link.remove();

      // Render the LinkPreview
      const root = createRoot(container);
      root.render(
        <LinkPreview url={href} className={classes}>
          <span dangerouslySetInnerHTML={{ __html: content }} />
        </LinkPreview>
      );
    });

    // Find all pre elements
    const preElements = ref.current.querySelectorAll('pre');

    preElements.forEach((pre) => {


      // Check if we've already processed this pre element
      if (pre.dataset.processed) return;
      pre.dataset.processed = 'true';

      // Determine the target container for the button
      // If pre is inside a figure created by rehype-pretty-code, use that figure
      const parent = pre.parentElement;
      let target: HTMLElement = pre;
      
      if (parent && parent.tagName === 'FIGURE' && parent.hasAttribute('data-rehype-pretty-code-figure')) {
        target = parent;
      }

      // Create the Mac window style wrapper
      const wrapper = document.createElement('div');
      wrapper.className = 'code-window group relative my-6';
      
      // Insert wrapper before target
      target.parentNode?.insertBefore(wrapper, target);

      // Create controls (red/yellow/green dots)
      const controls = document.createElement('div');
      controls.className = 'code-window-controls';
      ['red', 'yellow', 'green'].forEach((color) => {
        const dot = document.createElement('div');
        dot.className = `dot ${color}`;
        controls.appendChild(dot);
      });
      wrapper.appendChild(controls);
      
      // Move target into wrapper
      wrapper.appendChild(target);

      // Create button container
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity z-10';
      wrapper.appendChild(buttonContainer);

      // Get text content to copy
      // We want the raw text, not the HTML with spans.
      // pre.textContent usually gives the correct text.
      const codeText = pre.textContent || '';

      // Render the CopyButton
      const root = createRoot(buttonContainer);
      root.render(<CopyButton text={codeText} />);
    });

    return () => {
      zoom.detach();
    };
  }, [html]);

  return (
    <div 
      ref={ref}
      className={cn("prose dark:prose-invert max-w-none article-font", className)}
      dangerouslySetInnerHTML={{ __html: html }} 
    />
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [copied]);

  const onCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
  };

  return (
    <button
      onClick={onCopy}
      className="flex h-8 w-8 items-center justify-center rounded-md border bg-background/50 p-2 backdrop-blur-sm transition-all hover:bg-background hover:text-foreground text-muted-foreground"
      aria-label="Copy code"
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

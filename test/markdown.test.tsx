import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Markdown } from '../src/components/Markdown.js';

describe('the Markdown renderer', () => {
  it('renders headings one level down, since the page owns the h1', () => {
    render(<Markdown># A release</Markdown>);
    expect(screen.getByRole('heading', { level: 2, name: 'A release' })).toBeInTheDocument();
  });

  it('renders paragraphs, bold, italic and inline code', () => {
    const { container } = render(<Markdown>{'It **shipped**, *finally*, with `--flag`.'}</Markdown>);
    expect(container.querySelector('strong')?.textContent).toBe('shipped');
    expect(container.querySelector('em')?.textContent).toBe('finally');
    expect(container.querySelector('code')?.textContent).toBe('--flag');
  });

  it('renders both kinds of list', () => {
    const { container } = render(<Markdown>{'- one\n- two\n\n1. first\n2. second'}</Markdown>);
    expect(container.querySelectorAll('ul li')).toHaveLength(2);
    expect(container.querySelectorAll('ol li')).toHaveLength(2);
  });

  it('keeps a fenced code block literal, Markdown and all', () => {
    const { container } = render(<Markdown>{'```yaml\n# not a heading\nkey: **value**\n```'}</Markdown>);
    const code = container.querySelector('pre code');
    expect(code?.textContent).toBe('# not a heading\nkey: **value**');
    expect(code?.className).toBe('language-yaml');
    expect(container.querySelector('strong')).toBeNull();
  });

  it('renders block quotes and rules', () => {
    const { container } = render(<Markdown>{'> quoted\n\n---'}</Markdown>);
    expect(container.querySelector('blockquote')?.textContent).toContain('quoted');
    expect(container.querySelector('hr')).not.toBeNull();
  });

  it('links, and keeps the text when the scheme is not one it will link', () => {
    render(<Markdown>{'[docs](https://example.com) and [bad](javascript:alert(1))'}</Markdown>);
    expect(screen.getByRole('link', { name: 'docs' })).toHaveAttribute(
      'href',
      'https://example.com',
    );
    // The text stays, the link does not: visible rather than silent.
    expect(screen.getByText(/bad/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'bad' })).not.toBeInTheDocument();
  });

  describe('what it does with HTML, which is the whole reason it exists', () => {
    it('renders a script tag as the text it is', () => {
      const { container } = render(
        <Markdown>{'Before\n\n<script>alert(1)</script>\n\nAfter'}</Markdown>,
      );
      // No element was created, because this renderer builds elements and never
      // parses HTML — there is nothing here to sanitize.
      expect(container.querySelector('script')).toBeNull();
      expect(container.textContent).toContain('<script>alert(1)</script>');
    });

    it('renders an img with an onerror as text', () => {
      const { container } = render(<Markdown>{'<img src=x onerror="alert(1)">'}</Markdown>);
      expect(container.querySelector('img')).toBeNull();
      expect(container.textContent).toContain('<img src=x onerror="alert(1)">');
    });

    it('does not let an href carry a scheme that runs code', () => {
      const { container } = render(
        <Markdown>{'[x](JaVaScRiPt:alert(1)) [y](data:text/html,<script>)'}</Markdown>,
      );
      for (const anchor of container.querySelectorAll('a')) {
        expect(anchor.getAttribute('href')).toMatch(/^(https?:\/\/|\/|#|mailto:)/);
      }
    });
  });
});

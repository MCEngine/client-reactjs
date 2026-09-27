import { Fragment, type ReactNode } from 'react';

/**
 * Markdown, rendered as React elements.
 *
 * **There is no HTML anywhere in this file, and that is the point.** The usual
 * way to render Markdown is to turn it into an HTML string and hand it to
 * `dangerouslySetInnerHTML`, which is exactly the step that then needs
 * sanitizing — and a sanitizer is a list of things somebody thought of. This
 * builds elements instead, so a `<script>` in a news body is a paragraph that
 * reads `<script>`, because that is what it is.
 *
 * The subset is deliberate and documented on the write pages: headings, bold,
 * italic, inline code, links, lists, block quotes, fenced code, and rules.
 * Anything else is text.
 */
export interface MarkdownProps {
  children: string;
  /**
   * What `#` becomes. The page's own `<h1>` is its title, so a body that starts
   * with `#` should produce an `<h2>` rather than a second first-level heading.
   */
  headingOffset?: number;
}

export function Markdown({ children, headingOffset = 1 }: MarkdownProps) {
  return <>{blocks(children, headingOffset)}</>;
}

/** Splits the source into blocks. Line-based, because Markdown's blocks are. */
function blocks(source: string, headingOffset: number): ReactNode[] {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const out: ReactNode[] = [];
  let index = 0;
  let key = 0;

  while (index < lines.length) {
    const line = lines[index] ?? '';

    if (line.trim() === '') {
      index += 1;
      continue;
    }

    // Fenced code. Everything inside is literal, including Markdown.
    const fence = /^```(\w*)\s*$/.exec(line);
    if (fence !== null) {
      const language = fence[1] ?? '';
      const body: string[] = [];
      index += 1;
      while (index < lines.length && !/^```\s*$/.test(lines[index] ?? '')) {
        body.push(lines[index] ?? '');
        index += 1;
      }
      index += 1; // the closing fence, or the end of the source
      out.push(
        <pre key={key++} className="md-code">
          <code {...(language === '' ? {} : { className: `language-${language}` })}>
            {body.join('\n')}
          </code>
        </pre>,
      );
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading !== null) {
      const level = Math.min(6, (heading[1] ?? '#').length + headingOffset);
      const Tag = `h${level}` as 'h2';
      out.push(<Tag key={key++}>{inline(heading[2] ?? '')}</Tag>);
      index += 1;
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      out.push(<hr key={key++} />);
      index += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quoted: string[] = [];
      while (index < lines.length && /^>\s?/.test(lines[index] ?? '')) {
        quoted.push((lines[index] ?? '').replace(/^>\s?/, ''));
        index += 1;
      }
      out.push(<blockquote key={key++}>{blocks(quoted.join('\n'), headingOffset)}</blockquote>);
      continue;
    }

    const bullet = /^[-*+]\s+(.*)$/;
    const numbered = /^\d+[.)]\s+(.*)$/;
    if (bullet.test(line) || numbered.test(line)) {
      const ordered = numbered.test(line);
      const pattern = ordered ? numbered : bullet;
      const items: string[] = [];
      while (index < lines.length && pattern.test(lines[index] ?? '')) {
        items.push(pattern.exec(lines[index] ?? '')?.[1] ?? '');
        index += 1;
      }
      const children = items.map((item, i) => <li key={i}>{inline(item)}</li>);
      out.push(ordered ? <ol key={key++}>{children}</ol> : <ul key={key++}>{children}</ul>);
      continue;
    }

    // A paragraph runs to the next blank line or block start.
    const paragraph: string[] = [];
    while (index < lines.length) {
      const current = lines[index] ?? '';
      if (
        current.trim() === '' ||
        /^```/.test(current) ||
        /^#{1,6}\s/.test(current) ||
        /^>\s?/.test(current) ||
        bullet.test(current) ||
        numbered.test(current)
      ) {
        break;
      }
      paragraph.push(current);
      index += 1;
    }
    out.push(<p key={key++}>{inline(paragraph.join(' '))}</p>);
  }

  return out;
}

/**
 * Only these schemes become an `href`.
 *
 * This file injects no HTML, but an `href` is a vector on its own: React will
 * happily render `javascript:` into one. Anything else keeps its text and loses
 * its link, which is visible rather than silent.
 */
function safeHref(href: string): string | undefined {
  const trimmed = href.trim();
  if (/^(https?:\/\/|\/|#|mailto:)/i.test(trimmed)) return trimmed;
  return undefined;
}

const INLINE =
  /(\*\*[^*]+\*\*)|(\*[^*]+\*)|(`[^`]+`)|(\[[^\]]*\]\([^)\s]*\))/;

/** Bold, italic, inline code and links. Everything else is text. */
function inline(source: string): ReactNode {
  const parts: ReactNode[] = [];
  let rest = source;
  let key = 0;

  while (rest.length > 0) {
    const match = INLINE.exec(rest);
    if (match === null || match.index === undefined) {
      parts.push(rest);
      break;
    }

    if (match.index > 0) parts.push(rest.slice(0, match.index));
    const token = match[0];

    if (token.startsWith('**')) {
      parts.push(<strong key={key++}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('`')) {
      parts.push(<code key={key++}>{token.slice(1, -1)}</code>);
    } else if (token.startsWith('[')) {
      const link = /^\[([^\]]*)\]\(([^)\s]*)\)$/.exec(token);
      const text = link?.[1] ?? token;
      const href = safeHref(link?.[2] ?? '');
      parts.push(
        href === undefined ? (
          <Fragment key={key++}>{text}</Fragment>
        ) : (
          <a key={key++} href={href}>
            {text}
          </a>
        ),
      );
    } else {
      parts.push(<em key={key++}>{token.slice(1, -1)}</em>);
    }

    rest = rest.slice(match.index + token.length);
  }

  return parts;
}

import { useState } from 'react';
import { Field, Form } from '../../components/Form.js';
import { Markdown } from '../../components/Markdown.js';
import type { News } from '../../api/types.js';

export interface NewsFormProps {
  /** What to start from. Absent when writing a new item. */
  initial?: News;
  submitLabel: string;
  successMessage: string;
  onSubmit(input: { title: string; summary: string; body: string }): Promise<void>;
}

/**
 * The form behind both writing and editing, because they differ only in what
 * they start from and where they send it.
 *
 * The body is Markdown with a preview beside it — rendered by the same
 * component that renders the published page, so what is previewed is what will
 * be read rather than an approximation of it.
 */
export function NewsForm({ initial, submitLabel, successMessage, onSubmit }: NewsFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [summary, setSummary] = useState(initial?.summary ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [preview, setPreview] = useState(false);

  return (
    <>
      <Form
        submitLabel={submitLabel}
        successMessage={successMessage}
        onSubmit={() => onSubmit({ title, summary, body })}
      >
        <Field label="Title" value={title} onChange={setTitle} required />
        <Field
          label="Summary"
          value={summary}
          onChange={setSummary}
          required
          hint="One line. It is what the list shows, and all it shows."
        />
        <p className="field">
          <label>
            Body
            <textarea
              rows={18}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              required
            />
          </label>
          <small className="field__hint">
            Markdown: <code># heading</code>, <code>**bold**</code>, <code>*italic*</code>,{' '}
            <code>`code`</code>, <code>[text](https://…)</code>, <code>- lists</code>,{' '}
            <code>1. lists</code>, <code>&gt; quotes</code>, fenced code blocks and{' '}
            <code>---</code>. Anything else — HTML included — is shown as the text it is.
          </small>
        </p>
      </Form>

      <div className="btn-row">
        <button className="btn" type="button" onClick={() => setPreview((on) => !on)}>
          {preview ? 'Hide preview' : 'Show preview'}
        </button>
      </div>

      {preview && (
        <section className="panel" aria-labelledby="preview-heading">
          <h2 id="preview-heading">Preview</h2>
          {/* The same renderer the published page uses, so this is not an
              approximation of what a reader will get. */}
          <div className="prose">
            <Markdown>{body}</Markdown>
          </div>
        </section>
      )}
    </>
  );
}

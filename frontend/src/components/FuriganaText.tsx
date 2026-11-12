/**
 * Parses a furigana-annotated string of the form 漢字[かんじ]
 * into React elements with proper <ruby> tags.
 *
 * Rules:
 * - Tolerant: if a bracket is malformed (empty reading, unclosed, etc.)
 *   it falls through as plain text.
 * - Only kanji tokens should have annotations, but the parser does not
 *   enforce this — it just renders whatever the LLM provides.
 *
 * Example input:  "日本語[にほんご]を勉強[べんきょう]しています。"
 * Example output: <ruby>日本語<rt>にほんご</rt></ruby>を<ruby>勉強<rt>べんきょう</rt></ruby>しています。
 */

import { Fragment } from 'react';

interface Segment {
  base: string;
  reading: string | null;
}

/**
 * Character-by-character parser.
 * Scans left to right; when it hits `[`, it closes the previous plain-text
 * run and treats the last 'word' (non-space kanji run) as the ruby base.
 * Falls through gracefully on malformed input.
 */
function parseSegments(text: string): Segment[] {
  const segments: Segment[] = [];

  let i = 0;
  while (i < text.length) {
    const openBracket = text.indexOf('[', i);

    if (openBracket === -1) {
      // No more annotations — emit the rest as plain text
      const rest = text.slice(i);
      if (rest) segments.push({ base: rest, reading: null });
      break;
    }

    const closeBracket = text.indexOf(']', openBracket + 1);
    if (closeBracket === -1) {
      // Unclosed bracket — emit everything as plain text
      const rest = text.slice(i);
      if (rest) segments.push({ base: rest, reading: null });
      break;
    }

    const reading = text.slice(openBracket + 1, closeBracket).trim();
    const before = text.slice(i, openBracket);

    if (!reading) {
      // Empty bracket like [] — treat as plain text, skip brackets
      if (before) segments.push({ base: before, reading: null });
      i = closeBracket + 1;
      continue;
    }

    if (!before) {
      // No base text before bracket — orphan reading, emit as plain text
      segments.push({ base: `[${reading}]`, reading: null });
      i = closeBracket + 1;
      continue;
    }

    // The annotation should attach to the last 'token' in `before`.
    // A token is a maximal run of non-space characters.
    // Everything before the last token becomes a plain-text segment.
    const lastSpace = Math.max(before.lastIndexOf(' '), before.lastIndexOf('\u3000'));
    if (lastSpace !== -1) {
      const prefix = before.slice(0, lastSpace + 1);
      const base = before.slice(lastSpace + 1);
      if (prefix) segments.push({ base: prefix, reading: null });
      segments.push({ base, reading });
    } else {
      segments.push({ base: before, reading });
    }

    i = closeBracket + 1;
  }

  return segments.filter((s) => s.base !== '');
}

interface FuriganaTextProps {
  text: string;
  className?: string;
}

export default function FuriganaText({ text, className }: FuriganaTextProps) {
  const segments = parseSegments(text);

  return (
    <span className={className} lang="ja">
      {segments.map((seg, i) =>
        seg.reading ? (
          <ruby key={i}>
            {seg.base}
            <rt>{seg.reading}</rt>
          </ruby>
        ) : (
          <Fragment key={i}>{seg.base}</Fragment>
        ),
      )}
    </span>
  );
}

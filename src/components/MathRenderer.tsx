import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";
import { useMemo } from "react";

interface MathRendererProps {
  text: string;
  className?: string;
}

/**
 * Renders text containing LaTeX math expressions.
 * Supports:
 *   - Inline:  $...$  or  \(...\)
 *   - Block:   $$...$$ or \[...\]
 * Anything outside these delimiters is rendered as plain text.
 */
export function MathRenderer({ text, className }: MathRendererProps) {
  const parts = useMemo(() => parseMath(text || ""), [text]);

  return (
    <span className={className}>
      {parts.map((p, i) => {
        if (p.type === "text") {
          // Preserve newlines
          return (
            <span key={i} style={{ whiteSpace: "pre-wrap" }}>
              {p.value}
            </span>
          );
        }
        try {
          return p.type === "inline" ? (
            <InlineMath key={i} math={p.value} />
          ) : (
            <BlockMath key={i} math={p.value} />
          );
        } catch {
          return <span key={i}>{p.value}</span>;
        }
      })}
    </span>
  );
}

type Part = { type: "text" | "inline" | "block"; value: string };

function parseMath(input: string): Part[] {
  const parts: Part[] = [];
  // Order matters: longest delimiters first
  const regex = /(\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\$([^$\n]+?)\$|\\\(([\s\S]+?)\\\))/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(input)) !== null) {
    if (m.index > lastIndex) {
      parts.push({ type: "text", value: input.slice(lastIndex, m.index) });
    }
    const block = m[2] ?? m[3];
    const inline = m[4] ?? m[5];
    if (block !== undefined) {
      parts.push({ type: "block", value: block.trim() });
    } else if (inline !== undefined) {
      parts.push({ type: "inline", value: inline.trim() });
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < input.length) {
    parts.push({ type: "text", value: input.slice(lastIndex) });
  }
  return parts;
}

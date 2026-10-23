/**
 * Small markdown renderer. Lessons are data, sometimes pasted from a bot,
 * so this never injects raw HTML. Supported: headings, lists, quotes,
 * fenced code, bold, italic, inline code, links, and https images.
 */
import type { ReactNode } from "react";

type Block =
  | { type: "h"; level: 1 | 2 | 3; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "quote"; text: string }
  | { type: "code"; text: string }
  | { type: "hr" };

export function parseBlocks(source: string): Block[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? "";
    if (line.trim() === "") {
      index += 1;
      continue;
    }
    if (line.trim() === "---" || line.trim() === "***") {
      blocks.push({ type: "hr" });
      index += 1;
      continue;
    }
    if (line.startsWith("```")) {
      const buffer: string[] = [];
      index += 1;
      while (index < lines.length && !(lines[index] ?? "").startsWith("```")) {
        buffer.push(lines[index] ?? "");
        index += 1;
      }
      if (index < lines.length) index += 1;
      blocks.push({ type: "code", text: buffer.join("\n") });
      continue;
    }

    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1]!.length as 1 | 2 | 3;
      blocks.push({ type: "h", level, text: heading[2] ?? "" });
      index += 1;
      continue;
    }
    if (line.startsWith("> ")) {
      const buffer = [line.slice(2)];
      index += 1;
      while (index < lines.length && (lines[index] ?? "").startsWith("> ")) {
        buffer.push((lines[index] ?? "").slice(2));
        index += 1;
      }
      blocks.push({ type: "quote", text: buffer.join(" ") });
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*[-*]\s+/.test(lines[index] ?? "")) {
        items.push((lines[index] ?? "").replace(/^\s*[-*]\s+/, ""));
        index += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index] ?? "")) {
        items.push((lines[index] ?? "").replace(/^\s*\d+\.\s+/, ""));
        index += 1;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    const buffer = [line.trim()];
    index += 1;
    while (
      index < lines.length &&
      (lines[index] ?? "").trim() !== "" &&
      !/^(#{1,3}\s|>\s|```|\s*[-*]\s|\s*\d+\.\s|---|\*\*\*)/.test(lines[index] ?? "")
    ) {
      buffer.push((lines[index] ?? "").trim());
      index += 1;
    }
    blocks.push({ type: "p", text: buffer.join(" ") });
  }

  return blocks;
}

function parseInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let rest = text;
  let key = 0;

  while (rest.length > 0) {
    const code = /^`([^`]+)`/.exec(rest);
    const bold = /^\*\*([^*]+)\*\*/.exec(rest);
    const italic = /^\*([^*]+)\*/.exec(rest);
    const image = /^!\[([^\]]*)\]\((https:\/\/[^\s)]+)\)/.exec(rest);
    const link = /^\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/.exec(rest);
    const match = code || bold || italic || image || link;

    if (code) {
      nodes.push(
        <code key={key} className="rounded bg-elevated px-1 font-mono text-base text-ink">
          {code[1]}
        </code>,
      );
    } else if (bold) {
      nodes.push(
        <strong key={key} className="font-semibold text-ink">
          {bold[1]}
        </strong>,
      );
    } else if (italic) {
      nodes.push(<em key={key}>{italic[1]}</em>);
    } else if (image) {
      nodes.push(
        <img
          key={key}
          alt={image[1] ?? ""}
          src={image[2]}
          className="my-2 max-w-full rounded-xl"
          crossOrigin="anonymous"
        />,
      );
    } else if (link) {
      nodes.push(
        <a
          key={key}
          href={link[2]}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-ink underline decoration-brass underline-offset-2"
        >
          {link[1]}
        </a>,
      );
    }

    if (match) {
      rest = rest.slice(match[0].length);
      key += 1;
      continue;
    }

    const next = rest.slice(1).search(/[`*![]/);
    const take = next === -1 ? rest.length : next + 1;
    nodes.push(rest.slice(0, take));
    rest = rest.slice(take);
  }

  return nodes;
}

function Inline({ text }: { text: string }) {
  return <>{parseInline(text)}</>;
}

export function Markdown({ source }: { source: string }) {
  const blocks = parseBlocks(source);
  return (
    <div className="space-y-4 text-lg leading-relaxed text-pretty text-ink">
      {blocks.map((block, index) => {
        if (block.type === "h") {
          const Tag = block.level === 3 ? "h3" : "h2";
          const size = block.level === 3 ? "text-xl" : "text-2xl";
          return (
            <Tag key={index} className={`font-display ${size} leading-snug text-ink`}>
              <Inline text={block.text} />
            </Tag>
          );
        }
        if (block.type === "ul" || block.type === "ol") {
          const Tag = block.type === "ul" ? "ul" : "ol";
          const marker = block.type === "ul" ? "list-disc" : "list-decimal";
          return (
            <Tag key={index} className={`${marker} space-y-2 pl-5 marker:text-brass`}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  <Inline text={item} />
                </li>
              ))}
            </Tag>
          );
        }
        if (block.type === "quote") {
          return (
            <blockquote key={index} className="border-l-4 border-brass pl-4 text-ink">
              <Inline text={block.text} />
            </blockquote>
          );
        }
        if (block.type === "code") {
          return (
            <pre
              key={index}
              className="overflow-x-auto rounded-xl bg-elevated p-4 font-mono text-sm leading-relaxed text-ink"
            >
              {block.text}
            </pre>
          );
        }
        if (block.type === "hr") return <hr key={index} className="border-line" />;
        return (
          <p key={index}>
            <Inline text={block.text} />
          </p>
        );
      })}
    </div>
  );
}

import React from "react";
import { motion } from "framer-motion";

const parseInlineStyles = (text) => {
  if (typeof text !== "string") return text;
  const regex = /(\*\*.*?\*\*|`.*?`)/g;
  const splitText = text.split(regex);
  
  return splitText.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={idx} className="font-extrabold text-slate-950">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={idx} className="bg-slate-100 text-indigo-600 font-mono px-1.5 py-0.5 rounded text-[10px] border border-slate-200">{part.slice(1, -1)}</code>;
    }
    return part;
  });
};

const parseTable = (lines) => {
  const rows = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    if (line.match(/^\|?\s*:?-+:?\s*(\|?\s*:?-+:?\s*)*\|?$/)) {
      continue;
    }
    const cells = line.split("|")
      .map(c => c.trim())
      .filter((c, i, arr) => {
        if (i === 0 && line.startsWith("|") && c === "") return false;
        if (i === arr.length - 1 && line.endsWith("|") && c === "") return false;
        return true;
      });
      
    if (cells.length > 0) {
      rows.push(cells);
    }
  }
  
  if (rows.length === 0) return null;
  const headers = rows[0];
  const bodyRows = rows.slice(1);
  
  return (
    <div className="overflow-x-auto my-3.5 rounded-2xl border border-slate-200/80 shadow-sm bg-white/70 backdrop-blur-sm">
      <table className="w-full text-[11px] border-collapse">
        <thead>
          <tr className="bg-slate-900 text-slate-100 border-b border-slate-800">
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-2.5 text-left font-bold tracking-wider uppercase text-[10px]">
                {parseInlineStyles(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {bodyRows.map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-slate-50/70 transition-colors">
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="px-4 py-2 text-slate-700 font-medium">
                  {parseInlineStyles(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const parseList = (lines) => {
  return (
    <ul className="list-disc pl-5 my-2.5 space-y-1.5 text-slate-700 text-[11.5px]">
      {lines.map((line, idx) => {
        const cleanLine = line.replace(/^[\s*-+]\s*/, "");
        return (
          <li key={idx} className="leading-relaxed">
            {parseInlineStyles(cleanLine)}
          </li>
        );
      })}
    </ul>
  );
};

const AIResponseRenderer = ({ content }) => {
  if (!content) return null;

  // 1. Strip out thinking process tags (<think>...</think> or unclosed <think>...)
  let cleanContent = content
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<think>[\s\S]*/gi, "")
    .trim();

  // 2. Handle if the response content is wrapped in JSON formatting
  if (cleanContent.startsWith("{") && cleanContent.endsWith("}")) {
    try {
      const parsed = JSON.parse(cleanContent);
      if (parsed.response) {
        cleanContent = parsed.response;
      } else if (parsed.message) {
        cleanContent = parsed.message;
      } else if (parsed.reason) {
        cleanContent = parsed.reason;
      } else if (parsed.text) {
        cleanContent = parsed.text;
      }
    } catch (e) {
      // Keep original text if JSON parsing fails
    }
  }

  if (!cleanContent) return null;

  const blocks = [];
  let currentBlock = [];
  let insideCode = false;
  let codeLang = "";
  
  const lines = cleanContent.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.trim().startsWith("```")) {
      if (insideCode) {
        blocks.push({ type: "code", content: currentBlock.join("\n"), lang: codeLang });
        currentBlock = [];
        insideCode = false;
      } else {
        if (currentBlock.length > 0) {
          blocks.push({ type: "text", lines: currentBlock });
          currentBlock = [];
        }
        insideCode = true;
        codeLang = line.trim().slice(3);
      }
      continue;
    }
    
    if (insideCode) {
      currentBlock.push(line);
      continue;
    }
    
    if (line.trim().startsWith("|")) {
      if (currentBlock.length > 0 && !currentBlock[0].trim().startsWith("|")) {
        blocks.push({ type: "text", lines: currentBlock });
        currentBlock = [];
      }
      currentBlock.push(line);
      continue;
    }
    
    if (currentBlock.length > 0 && currentBlock[0].trim().startsWith("|") && !line.trim().startsWith("|")) {
      blocks.push({ type: "table", lines: currentBlock });
      currentBlock = [];
    }
    
    if (line.trim() === "") {
      if (currentBlock.length > 0) {
        blocks.push({ type: "text", lines: currentBlock });
        currentBlock = [];
      }
    } else {
      currentBlock.push(line);
    }
  }
  
  if (currentBlock.length > 0) {
    if (currentBlock[0].trim().startsWith("|")) {
      blocks.push({ type: "table", lines: currentBlock });
    } else if (insideCode) {
      blocks.push({ type: "code", content: currentBlock.join("\n"), lang: codeLang });
    } else {
      blocks.push({ type: "text", lines: currentBlock });
    }
  }

  return (
    <div className="space-y-3">
      {blocks.map((block, bIdx) => {
        let renderedContent = null;
        
        if (block.type === "code") {
          renderedContent = (
            <pre className="bg-slate-950 text-slate-200 p-4 rounded-2xl font-mono text-[11px] overflow-x-auto border border-slate-800 shadow-inner my-2">
              <code>{block.content}</code>
            </pre>
          );
        } else if (block.type === "table") {
          renderedContent = parseTable(block.lines);
        } else {
          const firstLine = block.lines[0].trim();
          if (firstLine.startsWith("- ") || firstLine.startsWith("* ") || firstLine.match(/^\d+\.\s/)) {
            renderedContent = parseList(block.lines);
          } else if (firstLine.startsWith(">")) {
            const quoteContent = block.lines.map(l => l.replace(/^>\s?/, "")).join(" ");
            renderedContent = (
              <blockquote className="border-l-4 border-indigo-500 pl-4 py-2 my-2 bg-indigo-50/20 text-slate-700 italic rounded-r-2xl text-[11px]">
                {parseInlineStyles(quoteContent)}
              </blockquote>
            );
          } else {
            renderedContent = (
              <div className="space-y-1.5 text-[11.5px]">
                {block.lines.map((line, idx) => (
                  <p key={idx} className="leading-relaxed">
                    {parseInlineStyles(line)}
                  </p>
                ))}
              </div>
            );
          }
        }
        
        return (
          <motion.div
            key={bIdx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: bIdx * 0.05 }}
          >
            {renderedContent}
          </motion.div>
        );
      })}
    </div>
  );
};

export default AIResponseRenderer;

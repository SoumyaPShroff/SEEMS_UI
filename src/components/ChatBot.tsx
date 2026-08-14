import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaCommentDots, FaTimes } from "react-icons/fa";
import { baseUrl } from "../const/BaseUrl";
import { useSideBarData } from "./SideBarData";
import type { SidebarItem } from "./SideBarData";

interface ChatMessage {
  role: "user" | "bot";
  text: string;
}

// Matches "Go to <page>", "Goto <page>", "Open <page>", "Navigate to <page>" (case-insensitive).
const GO_TO_REGEX = /^\s*(?:go\s*to|goto|open|navigate\s*to)\s+(.+?)\s*[.!]?\s*$/i;

// Words users type that carry no page-identifying meaning (e.g. "go to the invoice page").
const STOPWORDS = new Set(["the", "a", "an", "page", "screen", "tab", "section", "view", "menu"]);

const splitCamelCase = (s: string) =>
  s
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2");

const tokenize = (s: string) =>
  splitCamelCase(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((t) => t && !STOPWORDS.has(t));

const normalize = (s: string) => tokenize(s).join(" ");

// Only leaf menu entries carry a real path - main/sub headings just group them.
const flattenPages = (items: SidebarItem[]): SidebarItem[] => {
  const out: SidebarItem[] = [];
  for (const item of items) {
    if (item.path && item.path !== "#") out.push(item);
    if (item.subNav) out.push(...flattenPages(item.subNav));
  }
  return out;
};

interface PageMatch {
  exact?: SidebarItem;
  candidates: SidebarItem[];
}

// Users type brief/approximate names ("invoice appr", "po allocation"), not the exact title, so this
// scores every page by how many of the query's (few) words are a prefix/substring match against the
// page's title or route words, rather than requiring a full substring/exact match.
const findPage = (query: string, pages: SidebarItem[]): PageMatch => {
  const qTokens = tokenize(query);
  if (qTokens.length === 0) return { candidates: [] };

  const qNorm = qTokens.join(" ");
  const exact = pages.find((p) => normalize(p.title) === qNorm || (p.route && normalize(p.route) === qNorm));
  if (exact) return { exact, candidates: [exact] };

  const scored = pages
    .map((page) => {
      const pageTokens = [...tokenize(page.title), ...tokenize(page.route || "")];
      const matchedCount = qTokens.filter((qt) =>
        pageTokens.some((pt) => pt.startsWith(qt) || qt.startsWith(pt))
      ).length;
      return { page, score: matchedCount / qTokens.length };
    })
    .filter((s) => s.score >= 0.6)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return { candidates: [] };

  const topScore = scored[0].score;
  const top = scored.filter((s) => s.score === topScore).map((s) => s.page);

  return top.length === 1 ? { exact: top[0], candidates: top } : { candidates: top.slice(0, 5) };
};

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();
  const menu = useSideBarData();
  const pages = flattenPages(menu);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, open]);

  const sendMessage = async () => {
    const trimmed = message.trim();
    if (!trimmed || sending) return;
    setMessage("");

    const goToMatch = trimmed.match(GO_TO_REGEX);
    if (goToMatch) {
      const pageQuery = goToMatch[1];
      const { exact, candidates } = findPage(pageQuery, pages);

      if (exact?.path) {
        setChat((prev) => [
          ...prev,
          { role: "user", text: trimmed },
          { role: "bot", text: `Navigating to ${exact.title}...` },
        ]);
        navigate(exact.path);
      } else if (candidates.length > 1) {
        const options = candidates.map((c) => c.title).join(", ");
        setChat((prev) => [
          ...prev,
          { role: "user", text: trimmed },
          { role: "bot", text: `Did you mean one of these: ${options}? Type the full name to go there.` },
        ]);
      } else {
        setChat((prev) => [
          ...prev,
          { role: "user", text: trimmed },
          {
            role: "bot",
            text: `I couldn't find a page matching "${pageQuery}". Check the sidebar for the page name and try again.`,
          },
        ]);
      }
      return;
    }

    setChat((prev) => [...prev, { role: "user", text: trimmed }]);
    setSending(true);
    try {
      const res = await axios.post(`${baseUrl}/api/Chat`, { message: trimmed });
      setChat((prev) => [
        ...prev,
        { role: "bot", text: typeof res.data === "string" ? res.data : JSON.stringify(res.data) },
      ]);
    } catch (error) {
      console.error("Chat request failed:", error);
      setChat((prev) => [...prev, { role: "bot", text: "Sorry, something went wrong. Please try again." }]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div style={{ position: "fixed", right: 24, bottom: 24, zIndex: 1200, fontFamily: "'Inter', sans-serif" }}>
      {open && (
        <div
          style={{
            width: 420,
            height: 420,
            marginBottom: 12,
            borderRadius: 12,
            background: "#ffffff",
            boxShadow: "0 12px 32px rgba(0,0,0,0.25)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            border: "1px solid #d6e1f2",
          }}
        >
          <div
            style={{
              background: "linear-gradient(90deg,#0f4ea6,#3c78d8)",
              color: "#fff",
              padding: "10px 14px",
              fontWeight: 700,
              fontSize: "0.9rem",
            }}
          >
            SIA
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px", background: "#f7faff" }}>
            {chat.length === 0 && (
              <div style={{ fontSize: "0.78rem", color: "#6b7c93" }}>
                Try typing "Go to Invoice Approval" to jump straight to a page.
              </div>
            )}
            {chat.map((c, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: c.role === "user" ? "flex-end" : "flex-start",
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    maxWidth: "80%",
                    padding: "6px 10px",
                    borderRadius: 10,
                    fontSize: "0.82rem",
                    whiteSpace: "pre-wrap",
                    background: c.role === "user" ? "#0f4ea6" : "#e8f0fe",
                    color: c.role === "user" ? "#fff" : "#0f2d55",
                  }}
                >
                  {c.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div style={{ display: "flex", borderTop: "1px solid #e5ecf8", padding: 8, gap: 6 }}>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='e.g. "Go to Invoice Approval"'
              disabled={sending}
              style={{
                flex: 1,
                fontSize: "0.82rem",
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid #cfd9ea",
                outline: "none",
              }}
            />
            <button
              onClick={sendMessage}
              disabled={sending}
              style={{
                fontSize: "0.82rem",
                padding: "6px 12px",
                borderRadius: 8,
                border: "none",
                background: "#0f4ea6",
                color: "#fff",
                cursor: sending ? "default" : "pointer",
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Toggle SIA"
        style={{
          width: 52,
          height: 52,
          borderRadius: "50%",
          border: "none",
          background: "linear-gradient(135deg,#0f4ea6,#3c78d8)",
          color: "#fff",
          fontSize: "1.4rem",
          cursor: "pointer",
          boxShadow: "0 8px 20px rgba(15,78,166,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {open ? <FaTimes /> : <FaCommentDots />}
      </button>
    </div>
  );
}

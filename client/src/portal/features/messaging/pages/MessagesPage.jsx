import React, { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, Paperclip, Check, CheckCheck } from "lucide-react";
import { listMessages, sendMessage, markMessagesRead } from "../api";
import { listCustomers } from "../../customers/api";
import Skeleton from "../../../shared/ui/Skeleton";
import { useToast } from "../../../shared/ui/Toast";
import { useAccess } from "../../../shared/hooks/useAccess";

function fmtTime(dt) {
  if (!dt) return "";
  const d = new Date(dt);
  const today = new Date();
  const sameDay =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
  if (sameDay) {
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function Avatar({ name = "", size = 32 }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] || "")
    .join("")
    .toUpperCase();
  return (
    <div
      className="flex items-center justify-center rounded-full bg-slate-200 text-[11px] font-bold text-slate-600 flex-shrink-0"
      style={{ width: size, height: size }}
    >
      {initials || "?"}
    </div>
  );
}

function MessageBubble({ msg, isOwn }) {
  const author = msg.authorId || {};
  const authorName = author.fullName || author.name || "Unknown";
  const readByCount = (msg.readBy || []).length;
  return (
    <div className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"} mb-3`}>
      {!isOwn && <Avatar name={authorName} size={28} />}
      <div className={`max-w-[68%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
        {!isOwn && (
          <span className="mb-0.5 text-[11px] font-semibold text-slate-500">
            {authorName}
          </span>
        )}
        <div
          className={`rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed ${
            isOwn
              ? "rounded-br-sm bg-[#6F7FD9] text-white"
              : "rounded-bl-sm bg-white border border-slate-100 text-slate-800 shadow-sm"
          }`}
        >
          {msg.body}
          {(msg.attachmentUrls || []).length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {msg.attachmentUrls.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 rounded bg-white/20 px-2 py-0.5 text-[11px] underline"
                >
                  <Paperclip size={10} />
                  Attachment {i + 1}
                </a>
              ))}
            </div>
          )}
        </div>
        <div className={`mt-0.5 flex items-center gap-1 text-[10px] text-slate-400 ${isOwn ? "flex-row-reverse" : ""}`}>
          <span>{fmtTime(msg.createdAt)}</span>
          {isOwn && (
            readByCount > 1
              ? <CheckCheck size={11} className="text-blue-400" />
              : <Check size={11} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── customer selector sidebar ─────────────────────────────────── */
function CustomerList({ customers, selected, onSelect, loading }) {
  return (
    <div className="flex h-full flex-col border-r border-slate-100">
      <div className="px-4 py-3 border-b border-slate-100">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Clients</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading
          ? [...Array(4)].map((_, i) => (
              <div key={i} className="px-4 py-3">
                <Skeleton className="h-8 w-full" />
              </div>
            ))
          : customers.map((c) => (
              <button
                key={c._id}
                type="button"
                onClick={() => onSelect(c)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50 ${
                  selected?._id === c._id ? "bg-indigo-50 border-r-2 border-[#6F7FD9]" : ""
                }`}
              >
                <Avatar name={c.companyName || c.contactName || "?"} size={34} />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-slate-800">
                    {c.companyName || c.contactName || "Client"}
                  </p>
                  <p className="truncate text-[11px] text-slate-400">{c.contactName || ""}</p>
                </div>
              </button>
            ))}
      </div>
    </div>
  );
}

/* ─── main page ──────────────────────────────────────────────────── */
export default function MessagesPage() {
  const toast = useToast();
  // PI closure: client vs staff view comes from the user's internal flag
  // (the same rule the API uses), not a list of role names; sending needs
  // messaging.write (POST /api/messaging), reading needs messaging.read.
  const access = useAccess();
  const me = access.user || {};
  const isClient = !access.isInternal;
  const canSend = access.can("messaging.write");

  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(!isClient);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);

  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  // For client users, their customerId is stored directly
  useEffect(() => {
    if (isClient) {
      if (me.clientId) {
        setSelectedCustomer({ _id: me.clientId, companyName: "Expresso" });
      }
      return;
    }
    setCustomersLoading(true);
    listCustomers({ limit: 200 })
      .then((r) => setCustomers(r?.items || []))
      .catch(() => {})
      .finally(() => setCustomersLoading(false));
  }, [isClient, me.clientId]);

  useEffect(() => {
    if (!selectedCustomer?._id) return;
    setMsgLoading(true);
    listMessages({ customerId: selectedCustomer._id, limit: 100 })
      .then((r) => {
        setMessages(r?.items || []);
        markMessagesRead(selectedCustomer._id).catch(() => {});
      })
      .catch(() => {})
      .finally(() => setMsgLoading(false));
  }, [selectedCustomer]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const trimmed = body.trim();
    if (!canSend || !trimmed || !selectedCustomer) return;
    setSending(true);
    try {
      const r = await sendMessage({ customerId: selectedCustomer._id, body: trimmed });
      if (r?.item) setMessages((prev) => [...prev, r.item]);
      setBody("");
      textareaRef.current?.focus();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Message was not sent.");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      {/* Sidebar — client list (hidden for client users) */}
      {!isClient && (
        <div className="w-64 flex-shrink-0">
          <CustomerList
            customers={customers}
            selected={selectedCustomer}
            onSelect={setSelectedCustomer}
            loading={customersLoading}
          />
        </div>
      )}

      {/* Chat area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5">
          <MessageCircle size={18} className="text-[#6F7FD9]" />
          <div>
            <p className="text-[14px] font-semibold text-slate-800">
              {selectedCustomer
                ? selectedCustomer.companyName || selectedCustomer.contactName || "Chat"
                : "Select a client"}
            </p>
            <p className="text-[11px] text-slate-400">
              {selectedCustomer ? "In-portal message thread" : "Choose a conversation to start"}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 px-5 py-4">
          {!selectedCustomer ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <MessageCircle size={40} className="mx-auto mb-3 text-slate-200" strokeWidth={1.5} />
                <p className="text-[13px] font-semibold text-slate-400">
                  {isClient ? "Loading your messages…" : "Select a client to start messaging"}
                </p>
              </div>
            </div>
          ) : msgLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? "" : "justify-end"}`}>
                  <Skeleton className="h-12 w-48 rounded-2xl" />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <MessageCircle size={36} className="mx-auto mb-3 text-slate-200" strokeWidth={1.5} />
                <p className="text-[13px] font-semibold text-slate-400">No messages yet</p>
                <p className="text-[12px] text-slate-300">Be the first to send a message</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => {
                const isOwn = String(msg.authorId?._id || msg.authorId) === String(me._id);
                return <MessageBubble key={msg._id} msg={msg} isOwn={isOwn} />;
              })}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Input area */}
        {selectedCustomer && !canSend ? (
          <div className="border-t border-slate-100 bg-white px-4 py-3 text-[13px] text-slate-500">
            You can read these messages but your role can't send messages.
          </div>
        ) : null}
        {selectedCustomer && canSend && (
          <div className="border-t border-slate-100 bg-white px-4 py-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
                rows={1}
                className="min-h-[40px] flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[13px] text-slate-800 outline-none transition focus:border-[#6F7FD9] focus:bg-white"
                style={{ maxHeight: 120 }}
              />
              <button
                type="button"
                onClick={handleSend}
                aria-label="Send message"
                disabled={!body.trim() || sending}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6F7FD9] text-white transition hover:bg-[#5a6bc8] disabled:opacity-40"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

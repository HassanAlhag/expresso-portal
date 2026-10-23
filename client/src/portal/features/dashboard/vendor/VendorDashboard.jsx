import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, FileText, LifeBuoy, RotateCcw, Send } from "lucide-react";

import Briefing from "../../../shared/ui/Briefing";
import MetricsStrip from "../../../shared/ui/MetricsStrip";
import Panel from "../../../shared/ui/Panel";
import AttentionList from "../../../shared/ui/AttentionList";
import Badge from "../../../shared/ui/Badge";
import Alert from "../../../shared/ui/Alert";
import LoadingState from "../../../shared/ui/LoadingState";
import { useAccess } from "../../../shared/hooks/useAccess";
import { QUOTE_STATUS_LABEL, QUOTE_STATUS_TONE, RFQ_STATUS_LABEL, date } from "../../procurement/format";
import { deriveVendorOverview, loadVendorOverview } from "./vendorOverview";

const KIND_ICON = { rfq: Send, rejected: RotateCcw };

// Vendor overview (PUI-5): the RFQs open to this vendor, what still needs a
// quote, and where the vendor's own quotations stand.
export default function VendorDashboard() {
  const access = useAccess();
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    loadVendorOverview().then((d) => !cancelled && setData(d));
    return () => {
      cancelled = true;
    };
  }, []);

  const view = data ? deriveVendorOverview(data) : null;
  const first = String(access.user?.fullName || "").trim().split(/\s+/)[0];
  const when = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const n = view?.notQuotedCount || 0;

  return (
    <div className="px-stack" style={{ gap: 20 }}>
      <Briefing
        when={when}
        links={[
          { to: "/portal/procurement/rfqs", label: "Open RFQs", icon: FileText },
          { to: "/portal/procurement/rfqs?view=quoted", label: "Your quotations", icon: Send },
          access.canOpen("/portal/tickets") && { to: "/portal/tickets", label: "Contact Expresso", icon: LifeBuoy },
        ].filter(Boolean)}
      >
        {first ? `Hello, ${first}. ` : "Hello. "}
        {!view ? "Loading your RFQs…" : view.failed.includes("open") ? "Your RFQs didn't load." : n ? `${n} open RFQ${n === 1 ? " is" : "s are"} waiting for your quotation.` : "You've quoted on every open RFQ in your categories."}
      </Briefing>

      {!view ? (
        <LoadingState rows={5} label="Loading your RFQs" />
      ) : (
        <>
          {view.failed.length ? (
            <Alert tone="warn" icon={AlertTriangle} title="Some figures didn't load">
              They show a dash instead of a number. Refresh the page to try again.
            </Alert>
          ) : null}
          <MetricsStrip label="Your RFQ summary" items={view.metrics} />
          <div className="px-grid px-cols-main">
            <Panel title="Waiting for your quotation" sub="Nearest deadline first" flush>
              <AttentionList
                items={view.attention.map((a) => ({ ...a, icon: KIND_ICON[a.kind] }))}
                empty={
                  <div className="px-inline-empty">
                    <CheckCircle2 size={18} aria-hidden="true" />
                    <span>No open RFQs are waiting for you.</span>
                  </div>
                }
              />
            </Panel>
            <Panel title="Your recent quotations" flush action={<Link className="px-link" to="/portal/procurement/rfqs?view=quoted">All quotations</Link>}>
              {view.recentQuoted.length ? (
                <ul className="px-list">
                  {view.recentQuoted.map((r) => (
                    <li key={r._id}>
                      <div style={{ minWidth: 0 }}>
                        <div className="px-t">
                          <Link to={`/portal/procurement/rfqs/${r._id}`}>{r.title || r.rfqNumber}</Link>
                        </div>
                        <div className="px-s">{[r.rfqNumber, `RFQ ${String(RFQ_STATUS_LABEL[r.status] || r.status).toLowerCase()}`, r.deadline ? `deadline ${date(r.deadline)}` : null].filter(Boolean).join(", ")}</div>
                      </div>
                      <Badge tone={QUOTE_STATUS_TONE[r.myQuotationStatus] || "neutral"} dot>{QUOTE_STATUS_LABEL[r.myQuotationStatus] || "Sent"}</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-inline-empty">
                  <Send size={18} aria-hidden="true" />
                  <span>You haven't sent any quotations yet.</span>
                </div>
              )}
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}

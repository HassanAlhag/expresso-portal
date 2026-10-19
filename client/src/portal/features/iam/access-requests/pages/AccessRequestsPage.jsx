import React, { useEffect, useMemo, useState } from "react";

import PageHeader from "../../../../shared/ui/PageHeader";
import Button from "../../../../shared/ui/Button";
import Card from "../../../../shared/ui/Card";
import Badge from "../../../../shared/ui/Badge";
import Skeleton from "../../../../shared/ui/Skeleton";
import EmptyState from "../../../../shared/ui/EmptyState";
import StatCard from "../../../../shared/ui/StatCard";
import FilterBar from "../../../../shared/ui/FilterBar";

import { RefreshCw, UserCheck, Check, X, Send } from "lucide-react";

import {
  listAccessRequests,
  approveAccessRequest,
  rejectAccessRequest,
} from "../api";
import InviteFromRequestModal from "../components/InviteFromRequestModal";

const STATUS = [
  { value: "", label: "All status" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "invited", label: "Invited" },
  { value: "rejected", label: "Rejected" },
];

function toneForStatus(status) {
  if (status === "pending") return "info";
  if (status === "approved") return "warning";
  if (status === "invited") return "success";
  if (status === "rejected") return "danger";
  return "neutral";
}

export default function AccessRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);

  const [inviteTarget, setInviteTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listAccessRequests({ q, status, limit: 50 });
      setRows(res?.items || []);
      setTotal(res?.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status]);

  const pendingCount = useMemo(
    () => rows.filter((x) => x.status === "pending").length,
    [rows]
  );
  const invitedCount = useMemo(
    () => rows.filter((x) => x.status === "invited").length,
    [rows]
  );

  const handleApprove = async (row) => {
    setBusy(true);
    try {
      await approveAccessRequest(row._id);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async (row) => {
    setBusy(true);
    try {
      await rejectAccessRequest(row._id);
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="grid gap-6">
        <PageHeader
          eyebrow="IAM"
          title="Access Requests"
          subtitle="Review requests for Client Portal access."
          breadcrumb={[
            { label: "Portal", to: "/portal" },
            { label: "Access Requests" },
          ]}
          right={
            <Button variant="outline" onClick={load} disabled={loading || busy}>
              <RefreshCw size={16} />
              Refresh
            </Button>
          }
        />

        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard icon={UserCheck} label="Total Requests" value={total} color="indigo" />
          <StatCard icon={UserCheck} label="Pending" value={pendingCount} color="amber" />
          <StatCard icon={UserCheck} label="Invited" value={invitedCount} color="emerald" />
        </div>

        <FilterBar
          searchValue={q}
          onSearchChange={setQ}
          searchPlaceholder="Search name, email, company…"
          filters={[
            { label: "status", value: status, onChange: setStatus, options: STATUS },
          ]}
          onClear={() => { setQ(""); setStatus(""); }}
        />

        {loading ? (
          <Card className="p-6">
            <div className="grid gap-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </Card>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={UserCheck}
            title="No access requests"
            message="Requests submitted from the public Request Access page will show up here."
          />
        ) : (
          <div className="overflow-hidden rounded-[28px] border border-black/[0.07] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-black/10 p-4">
              <div className="text-sm font-black text-slate-900">
                Requests ({rows.length})
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse bg-white">
                <thead className="bg-slate-50">
                  <tr className="border-b border-black/10">
                    <th className="px-4 py-3 text-left text-xs font-black tracking-[0.18em] text-slate-500">
                      REQUESTER
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-black tracking-[0.18em] text-slate-500">
                      COMPANY
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-black tracking-[0.18em] text-slate-500">
                      STATUS
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-black tracking-[0.18em] text-slate-500">
                      RECEIVED
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-black tracking-[0.18em] text-slate-500">
                      ACTIONS
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row._id}
                      className="border-b border-slate-100 hover:bg-black/[0.02]"
                    >
                      <td className="px-4 py-4 align-top">
                        <div className="text-sm font-black text-slate-900">
                          {row.fullName}
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                          {row.workEmail}
                        </div>
                        {row.phone ? (
                          <div className="mt-0.5 text-xs text-slate-500">{row.phone}</div>
                        ) : null}
                        {row.message ? (
                          <div className="mt-2 max-w-sm text-xs text-slate-500">
                            "{row.message}"
                          </div>
                        ) : null}
                      </td>

                      <td className="px-4 py-4 align-top text-sm text-slate-700">
                        {row.company}
                      </td>

                      <td className="px-4 py-4 align-top">
                        <Badge tone={toneForStatus(row.status)}>
                          {String(row.status || "").toUpperCase()}
                        </Badge>
                      </td>

                      <td className="px-4 py-4 align-top text-sm text-slate-700">
                        {row.createdAt
                          ? new Date(row.createdAt).toLocaleDateString()
                          : "—"}
                      </td>

                      <td className="px-4 py-4 text-right align-top">
                        <div className="flex justify-end gap-2">
                          {row.status === "pending" ? (
                            <>
                              <Button
                                variant="outline"
                                onClick={() => handleApprove(row)}
                                disabled={busy}
                              >
                                <Check size={16} />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handleReject(row)}
                                disabled={busy}
                              >
                                <X size={16} />
                                Reject
                              </Button>
                            </>
                          ) : null}

                          {["pending", "approved"].includes(row.status) ? (
                            <Button
                              onClick={() => setInviteTarget(row)}
                              disabled={busy}
                            >
                              <Send size={16} />
                              Invite
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <InviteFromRequestModal
        open={Boolean(inviteTarget)}
        request={inviteTarget}
        onClose={() => setInviteTarget(null)}
        onSaved={async () => {
          setInviteTarget(null);
          await load();
        }}
      />
    </>
  );
}

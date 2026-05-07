import React, { useEffect, useState } from "react";
import Card, { CardBody, CardHeader } from "../../../shared/ui/Card";
import Skeleton from "../../../shared/ui/Skeleton";
import CRMActivityComposer from "../components/CRMActivityComposer";
import CRMActivityTimeline from "../components/CRMActivityTimeline";
import { listActivities } from "../api";
import { Activity } from "lucide-react";

export default function DealActivitiesTab({ deal }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!deal?._id) return;
    setLoading(true);
    try {
      const res = await listActivities({ entityType: "deal", entityId: deal._id, limit: 100 });
      setItems(Array.isArray(res?.items) ? res.items : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [deal?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreated = (newItem) => {
    setItems((prev) => [newItem, ...prev]);
  };

  const handleDeleted = (id) => {
    setItems((prev) => prev.filter((x) => x._id !== id));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader
            title="Log activity"
            subtitle="Record a call, email, note or meeting"
            right={
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/8 bg-slate-50">
                <Activity size={15} className="text-slate-500" />
              </div>
            }
          />
          <CardBody>
            <CRMActivityComposer
              entityType="deal"
              entityId={deal?._id}
              onCreated={handleCreated}
            />
          </CardBody>
        </Card>
      </div>

      <div className="lg:col-span-3">
        <Card>
          <CardHeader title="Activity timeline" subtitle={`${items.length} activities logged`} />
          <CardBody>
            {loading ? (
              <div className="grid gap-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : (
              <CRMActivityTimeline items={items} canDelete onDeleted={handleDeleted} />
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

import React from "react";
import ReactFlow, { Background, Controls } from "reactflow";
import { Sparkles } from "lucide-react";

function RecoveryGraph({ txnId, logs, cleanAuditMessage }) {
  const txnLogs = logs
    .filter(log => {
      const logTxnId = log.transactionId?._id || log.transactionId;
      return logTxnId === txnId;
    })
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  if (!txnId) {
    return (
      <div className="flex flex-col items-center justify-center h-[350px] border border-dashed border-slate-200 bg-slate-50/50 rounded-3xl p-6 text-center">
        <Sparkles className="w-8 h-8 text-indigo-400 mb-2.5 animate-pulse animate-bounce" />
        <p className="text-slate-900 font-extrabold text-sm">No Sequence Selected</p>
        <p className="text-slate-400 font-semibold text-xs mt-1">Choose a customer payment failure attempt above to visualize the AI Agent's path.</p>
      </div>
    );
  }

  if (txnLogs.length === 0) {
    return (
      <div className="flex items-center justify-center h-[350px] border border-dashed border-slate-200 bg-slate-50/50 rounded-3xl text-slate-400 font-semibold text-xs">
        No logs found for this transaction to construct a decision path.
      </div>
    );
  }

  const nodes = [];
  const edges = [];
  
  let x = 250;
  let y = 30;

  nodes.push({
    id: "failed_checkout",
    type: "input",
    data: { 
      label: (
        <div className="p-3 text-center space-y-1">
          <div className="text-[9px] font-black text-rose-500 uppercase tracking-widest">STEP 1: TRIGGER</div>
          <div className="font-extrabold text-slate-900 text-xs">Payment Failed</div>
          <div className="text-[9px] text-slate-400 font-bold">Webhook detects failure</div>
        </div>
      ) 
    },
    position: { x, y },
    style: { background: "#fff", border: "2px solid #f43f5e", borderRadius: "16px", width: 220, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }
  });

  let prevNodeId = "failed_checkout";

  txnLogs.forEach((log, index) => {
    y += 130;
    const nodeId = `log_${log._id}`;
    let border = "1px solid #e2e8f0";
    let typeName = "STEP";
    let headerColor = "text-indigo-600";
    let title = log.action;
    let description = cleanAuditMessage(log.details?.message || log.details?.reason || "");

    if (log.action === "TRIGGER") {
      title = "AI Scheduler Alert";
      typeName = "STEP 2: COLLECT CONTEXT";
      headerColor = "text-slate-500";
      description = "AI collects customer profile, product details, amounts, and previous recovery notifications.";
    } else if (log.action === "NOTIFICATION_SENT") {
      title = "AI Sent Recovery Notification";
      typeName = "STEP 4: EXECUTE INTERVENTION";
      headerColor = "text-purple-600";
      border = "2px solid #a855f7";
    } else if (log.action === "DECISION") {
      title = `Decision: ${log.details?.action || "Remind Later"}`;
      typeName = "STEP 3: COGNITIVE ANALYSIS";
      headerColor = "text-blue-600";
      border = "2px solid #3b82f6";
      description = log.details?.reason || "AI decided wait cooldown.";
    } else if (log.action === "PAYMENT_SUCCESS") {
      title = "Payment Completed 🎉";
      typeName = "OUTCOME: RECOVERED";
      headerColor = "text-emerald-600";
      border = "3px solid #10b981";
      description = `Successfully recovered ₹${log.details?.amount || "unspecified"}!`;
    } else if (log.action === "CUSTOMER_ACTION") {
      title = `Customer Clicked: ${log.details?.action?.replace("_", " ") || "Remind Later"}`;
      typeName = "OUTCOME: PREFERENCE RECORDED";
      headerColor = "text-sky-600";
      border = "2px solid #0ea5e9";
    } else if (log.action === "ESCALATED") {
      title = "Support Escalated ⚠️";
      typeName = "OUTCOME: ESCALATED";
      headerColor = "text-rose-600";
      border = "2px solid #f43f5e";
    } else if (log.action === "STOPPED") {
      title = "Recovery Halted";
      typeName = "OUTCOME: ARCHIVED";
      headerColor = "text-slate-600";
    }

    nodes.push({
      id: nodeId,
      data: {
        label: (
          <div className="p-3 text-left space-y-1.5 max-w-[280px]">
            <div className={`text-[8px] font-black uppercase tracking-wider ${headerColor}`}>{typeName}</div>
            <div className="font-extrabold text-slate-900 text-xs flex items-center justify-between gap-1">
              <span className="truncate">{title}</span>
              <span className="text-[8px] text-slate-400 font-semibold shrink-0">
                {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            {description && (
              <p className="text-[9px] text-slate-500 font-semibold leading-relaxed border-t border-slate-100 pt-1">
                {description.substring(0, 100)}{description.length > 100 ? "..." : ""}
              </p>
            )}
          </div>
        )
      },
      position: { x: x - 30, y },
      style: { background: "#fff", border, borderRadius: "20px", width: 280, boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.05)" }
    });

    edges.push({
      id: `edge_${prevNodeId}_${nodeId}`,
      source: prevNodeId,
      target: nodeId,
      animated: log.action === "PAYMENT_SUCCESS" || log.action === "TRIGGER",
      style: { stroke: log.action === "PAYMENT_SUCCESS" ? "#10b981" : "#818cf8", strokeWidth: log.action === "PAYMENT_SUCCESS" ? 3 : 2 }
    });

    prevNodeId = nodeId;
  });

  return (
    <div className="h-[450px] border border-slate-200 rounded-3xl bg-slate-50/50 relative overflow-hidden shadow-inner flex flex-col">
      <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm text-[10px] text-slate-500 font-bold uppercase tracking-wider">
        Interactive Decision Flow
      </div>
      <div className="flex-1 w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          attribPosition="bottom-left"
        >
          <Background color="#cbd5e1" gap={16} />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}

export default RecoveryGraph;

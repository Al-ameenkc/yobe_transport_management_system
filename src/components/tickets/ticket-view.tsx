"use client";

import { useRef, useState } from "react";
import { Download, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { captureElementToCanvas } from "@/lib/capture-screenshot";

export interface TicketViewData {
  ticketCode: string;
  qrDataUrl: string;
  companyName: string;
  origin: string;
  destination: string;
  departureAt: string;
  plateNumber: string;
  seatNumbers: string[];
  amount: number;
  status: string;
}

const ticketStyles = {
  root: {
    background: "#ffffff",
    color: "#0f172a",
    borderRadius: "12px",
    border: "2px solid #a7f3d0",
    padding: "24px",
    maxWidth: "420px",
    margin: "0 auto",
    fontFamily: "system-ui, -apple-system, sans-serif",
    boxSizing: "border-box" as const,
  },
  header: {
    background: "linear-gradient(to right, #059669, #047857)",
    color: "#ffffff",
    margin: "-24px -24px 20px",
    padding: "16px 24px",
    borderBottom: "1px solid #d1fae5",
  },
  headerLabel: {
    fontSize: "11px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    color: "#d1fae5",
    marginBottom: "4px",
  },
  headerRoute: {
    fontSize: "22px",
    fontWeight: 700,
    lineHeight: 1.3,
  },
  badge: {
    display: "inline-block",
    background: "#d1fae5",
    color: "#065f46",
    borderRadius: "9999px",
    padding: "4px 10px",
    fontSize: "11px",
    fontWeight: 600,
    marginBottom: "8px",
  },
  ticketCode: {
    fontSize: "20px",
    fontWeight: 700,
    textAlign: "center" as const,
  },
  qrWrap: {
    display: "flex",
    justifyContent: "center",
    marginTop: "16px",
    marginBottom: "16px",
  },
  qr: {
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    width: "160px",
    height: "160px",
  },
  details: {
    background: "#f8fafc",
    borderRadius: "8px",
    padding: "16px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px 16px",
    fontSize: "13px",
    lineHeight: 1.5,
  },
  detailItem: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "2px",
  },
  detailLabel: {
    color: "#64748b",
    fontSize: "11px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
  },
  detailValue: {
    color: "#0f172a",
    fontWeight: 500,
  },
  statusBadge: {
    display: "inline-block",
    borderRadius: "9999px",
    padding: "2px 10px",
    fontSize: "11px",
    fontWeight: 600,
  },
  footer: {
    marginTop: "16px",
    textAlign: "center" as const,
    fontSize: "11px",
    color: "#94a3b8",
  },
} as const;

export function TicketView({ data }: { data: TicketViewData }) {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState<"pdf" | "image" | null>(null);

  async function downloadImage() {
    if (!ticketRef.current) return;
    setLoading("image");
    try {
      const canvas = await captureElementToCanvas(ticketRef.current);
      const link = document.createElement("a");
      link.download = `ticket-${data.ticketCode}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setLoading(null);
    }
  }

  async function downloadPdf() {
    if (!ticketRef.current) return;
    setLoading("pdf");
    try {
      const { jsPDF } = await import("jspdf");
      const canvas = await captureElementToCanvas(ticketRef.current);
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 10;
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", margin, margin, imgWidth, imgHeight);
      pdf.save(`ticket-${data.ticketCode}.pdf`);
    } finally {
      setLoading(null);
    }
  }

  const statusLabel = data.status === "confirmed" ? "Confirmed" : data.status;
  const statusStyle = {
    ...ticketStyles.statusBadge,
    background: data.status === "confirmed" ? "#d1fae5" : "#f1f5f9",
    color: data.status === "confirmed" ? "#065f46" : "#334155",
  };

  return (
    <div className="space-y-4">
      <div ref={ticketRef} data-ticket-export style={ticketStyles.root}>
        <div style={ticketStyles.header}>
          <div style={ticketStyles.headerLabel}>Trip Route</div>
          <div style={ticketStyles.headerRoute}>
            {data.origin} → {data.destination}
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <span style={ticketStyles.badge}>E-Ticket</span>
          <div style={ticketStyles.ticketCode}>{data.ticketCode}</div>
        </div>

        <div style={ticketStyles.qrWrap}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={data.qrDataUrl} alt="Ticket QR Code" style={ticketStyles.qr} />
        </div>

        <div style={ticketStyles.details}>
          <div style={ticketStyles.detailItem}>
            <span style={ticketStyles.detailLabel}>Operator</span>
            <span style={ticketStyles.detailValue}>{data.companyName}</span>
          </div>
          <div style={ticketStyles.detailItem}>
            <span style={ticketStyles.detailLabel}>Bus</span>
            <span style={ticketStyles.detailValue}>{data.plateNumber}</span>
          </div>
          <div style={{ ...ticketStyles.detailItem, gridColumn: "1 / -1" }}>
            <span style={ticketStyles.detailLabel}>Departure</span>
            <span style={ticketStyles.detailValue}>{formatDateTime(data.departureAt)}</span>
          </div>
          <div style={{ ...ticketStyles.detailItem, gridColumn: "1 / -1" }}>
            <span style={ticketStyles.detailLabel}>Seats</span>
            <span style={ticketStyles.detailValue}>{data.seatNumbers.join(", ")}</span>
          </div>
          <div style={ticketStyles.detailItem}>
            <span style={ticketStyles.detailLabel}>Amount</span>
            <span style={ticketStyles.detailValue}>{formatCurrency(data.amount)}</span>
          </div>
          <div style={ticketStyles.detailItem}>
            <span style={ticketStyles.detailLabel}>Status</span>
            <span style={statusStyle}>{statusLabel}</span>
          </div>
        </div>

        <p style={ticketStyles.footer}>
          YOBE LINE — present this QR code at the terminal for verification
        </p>
      </div>

      <div className="flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={downloadImage}
          loading={loading === "image"}
          disabled={loading !== null && loading !== "image"}
        >
          <ImageIcon className="mr-2 h-4 w-4" />
          Download as Image
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={downloadPdf}
          loading={loading === "pdf"}
          disabled={loading !== null && loading !== "pdf"}
        >
          <Download className="mr-2 h-4 w-4" />
          Download as PDF
        </Button>
      </div>

      <p className="text-center text-xs text-slate-500">
        A copy was also sent to your email and ticket number to your phone.
      </p>
    </div>
  );
}

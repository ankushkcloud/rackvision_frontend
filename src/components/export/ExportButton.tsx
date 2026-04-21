'use client';
import { useState, useRef, RefObject } from 'react';
import { Device, Rack, DEVICE_META, PORT_STATUS_COLORS, PORT_DEVICE_META } from '@/types';
import { deviceBorder } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Props {
  rack: Rack;
  devices: Device[];
  rackRef: RefObject<HTMLDivElement>;
}

export default function ExportButton({ rack, devices, rackRef }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const exportPNG = async () => {
    setBusy(true); setOpen(false);
    const tid = toast.loading('Capturing rack…');
    try {
      const { default: html2canvas } = await import('html2canvas');
      const el = rackRef.current;
      if (!el) throw new Error('No rack element');
      const canvas = await html2canvas(el, { backgroundColor: '#0f1117', scale: 2, useCORS: true, logging: false });
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `${rack.name.replace(/\s+/g, '-')}-rack.png`;
      link.click();
      toast.success('PNG exported!', { id: tid });
    } catch {
      toast.error('PNG export failed', { id: tid });
    } finally { setBusy(false); }
  };

  const exportPDF = async () => {
    setBusy(true); setOpen(false);
    const tid = toast.loading('Building PDF…');
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', format: 'a4', unit: 'mm' });
      const pw = doc.internal.pageSize.getWidth();
      let y = 15;

      // ── Title page header ────────────────────────────────────────────────────
      doc.setFillColor(15, 17, 23);
      doc.rect(0, 0, pw, 297, 'F');

      doc.setFillColor(30, 35, 55);
      doc.rect(0, 0, pw, 42, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18); doc.setFont('helvetica', 'bold');
      doc.text('RackVision — Rack Report', 15, 18);

      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      doc.setTextColor(180, 190, 210);
      doc.text(rack.name, 15, 27);
      if (rack.location) doc.text(`📍 ${rack.location}`, 15, 34);

      doc.setFontSize(9); doc.setTextColor(100, 110, 130);
      doc.text(`Generated: ${new Date().toLocaleString()}`, pw - 15, 18, { align: 'right' });
      doc.text(`${rack.totalU}U Rack · ${devices.length} devices`, pw - 15, 27, { align: 'right' });

      y = 52;

      // ── Utilization summary ──────────────────────────────────────────────────
      const usedU = devices.reduce((s, d) => s + d.uSize, 0);
      const freeU = rack.totalU - usedU;
      const pct   = Math.round((usedU / rack.totalU) * 100);

      doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(200, 210, 230);
      doc.text('Rack Utilization', 15, y); y += 7;

      // Progress bar
      const barW = pw - 30;
      doc.setFillColor(31, 41, 55); doc.roundedRect(15, y, barW, 6, 2, 2, 'F');
      const fillColor: [number, number, number] = pct >= 90 ? [239, 68, 68] : pct >= 75 ? [245, 158, 11] : [59, 130, 246];
      doc.setFillColor(...fillColor); doc.roundedRect(15, y, (barW * pct) / 100, 6, 2, 2, 'F');
      y += 10;

      doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(150, 165, 185);
      doc.text(`Total: ${rack.totalU}U    Used: ${usedU}U    Free: ${freeU}U    Utilization: ${pct}%`, 15, y);
      y += 12;

      // ── Device table ─────────────────────────────────────────────────────────
      doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(200, 210, 230);
      doc.text('Device Inventory', 15, y); y += 7;

      const cols = [
        { header: '#',           x: 15, w: 10  },
        { header: 'Device Name', x: 25, w: 48  },
        { header: 'Type',        x: 73, w: 26  },
        { header: 'IP Address',  x: 99, w: 36  },
        { header: 'U Position',  x: 135, w: 24 },
        { header: 'Size',        x: 159, w: 14 },
        { header: 'Serial',      x: 173, w: 32 },
      ];

      // Table header
      doc.setFillColor(25, 32, 50); doc.rect(15, y - 4, pw - 30, 8, 'F');
      doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 130, 170);
      cols.forEach(c => doc.text(c.header, c.x, y));
      y += 6;

      // Table rows
      const sorted = [...devices].sort((a, b) => a.uStart - b.uStart);
      sorted.forEach((d, idx) => {
        if (y > 270) { doc.addPage(); doc.setFillColor(15, 17, 23); doc.rect(0, 0, pw, 297, 'F'); y = 20; }

        // Alternating rows
        if (idx % 2 === 0) { doc.setFillColor(20, 26, 40); doc.rect(15, y - 3.5, pw - 30, 7, 'F'); }

        doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(200, 215, 235);
        doc.text(String(idx + 1),               cols[0].x, y);
        doc.text(d.name.slice(0, 22),            cols[1].x, y);
        doc.text(DEVICE_META[d.deviceType]?.label || d.deviceType, cols[2].x, y);
        doc.text(d.ipAddress || '—',             cols[3].x, y);
        doc.text(`U${d.uStart}–U${d.uStart + d.uSize - 1}`, cols[4].x, y);
        doc.text(`${d.uSize}U`,                  cols[5].x, y);
        doc.text((d.serialNumber || '—').slice(0, 14), cols[6].x, y);
        y += 7;
      });

      y += 5;

      // ── Switch port details ───────────────────────────────────────────────────
      const switches = devices.filter(d => ['switch', 'patch_panel'].includes(d.deviceType) && d.portCount > 0);

      for (const sw of switches) {
        if (y > 240) { doc.addPage(); doc.setFillColor(15, 17, 23); doc.rect(0, 0, pw, 297, 'F'); y = 20; }

        doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(200, 210, 230);
        doc.text(`${sw.name} — Port Mapping`, 15, y); y += 4;

        doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(120, 140, 165);
        doc.text(`${DEVICE_META[sw.deviceType]?.label} · ${sw.portCount} ports · IP: ${sw.ipAddress || 'N/A'}`, 15, y); y += 7;

        if (!sw.ports?.length) { doc.text('No port data available', 15, y); y += 8; continue; }

        // Port table headers
        const pCols = [
          { header:'Port', x:15,  w:12 },
          { header:'Label',x:27,  w:28 },
          { header:'Status',x:55, w:20 },
          { header:'Type',  x:75, w:28 },
          { header:'IP',    x:103, w:38 },
          { header:'Device', x:141, w:38 },
          { header:'VLAN', x:179, w:16 },
        ];

        doc.setFillColor(25, 32, 50); doc.rect(15, y - 4, pw - 30, 8, 'F');
        doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 130, 170);
        pCols.forEach(c => doc.text(c.header, c.x, y)); y += 5;

        sw.ports.forEach((p, pi) => {
          if (y > 275) { doc.addPage(); doc.setFillColor(15, 17, 23); doc.rect(0, 0, pw, 297, 'F'); y = 20; }
          if (pi % 2 === 0) { doc.setFillColor(20, 26, 40); doc.rect(15, y - 3, pw - 30, 6, 'F'); }

          const stColor: [number, number, number] = p.status === 'active' ? [16, 185, 129] : p.status === 'error' ? [239, 68, 68] : [107, 114, 128];
          doc.setFontSize(7); doc.setFont('helvetica', 'normal');
          doc.setTextColor(190, 205, 225);
          doc.text(String(p.portNumber),                         pCols[0].x, y);
          doc.text((p.label || `Port${p.portNumber}`).slice(0,14), pCols[1].x, y);
          doc.setTextColor(...stColor);
          doc.text(PORT_STATUS_COLORS[p.status]?.label || p.status, pCols[2].x, y);
          doc.setTextColor(190, 205, 225);
          doc.text((PORT_DEVICE_META[p.deviceType]?.label || '—').slice(0, 12), pCols[3].x, y);
          doc.text((p.ipAddress || '—').slice(0, 15),               pCols[4].x, y);
          doc.text((p.connectedDevice || '—').slice(0, 15),          pCols[5].x, y);
          doc.text(p.vlanId ? String(p.vlanId) : '—',               pCols[6].x, y);
          y += 5.5;
        });

        y += 6;
      }

      // ── Footer ────────────────────────────────────────────────────────────────
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7); doc.setTextColor(60, 75, 100);
        doc.text(`RackVision · ${rack.name} · Page ${i} of ${pageCount}`, pw / 2, 290, { align: 'center' });
      }

      doc.save(`${rack.name.replace(/\s+/g, '-')}-report.pdf`);
      toast.success('PDF exported!', { id: tid });
    } catch (e) {
      console.error(e);
      toast.error('PDF export failed', { id: tid });
    } finally { setBusy(false); }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(o => !o)}
        disabled={busy}
        className="btn-ghost flex items-center gap-1.5 text-xs py-1.5 px-3"
      >
        {busy
          ? <span className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"/>
          : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        }
        Export
        <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 min-w-[160px] animate-scale-in overflow-hidden">
          <button onClick={exportPDF} className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 transition-colors border-b border-gray-800">
            <span className="text-base">📄</span>
            <div className="text-left">
              <p className="font-medium text-xs">Export PDF</p>
              <p className="text-[10px] text-gray-600">Full report with ports</p>
            </div>
          </button>
          <button onClick={exportPNG} className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 transition-colors">
            <span className="text-base">🖼️</span>
            <div className="text-left">
              <p className="font-medium text-xs">Export PNG</p>
              <p className="text-[10px] text-gray-600">Rack screenshot</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

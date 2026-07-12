import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Pencil, Trash2, Ticket, AlertTriangle, Copy, Check,
  Power, X, Loader2,
} from "lucide-react";

export interface DiscountCode {
  id: string;
  code: string;
  description: string;
  type: "percent" | "fixed";
  value: number;
  minSubtotal: number;
  maxUses: number | null;
  usedCount: number;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
  createdAt: string;
}

type CodeStatus = "live" | "scheduled" | "expired" | "exhausted" | "inactive";

export function codeStatus(c: DiscountCode, now = new Date()): CodeStatus {
  if (!c.active) return "inactive";
  if (c.maxUses !== null && c.usedCount >= c.maxUses) return "exhausted";
  if (c.startsAt && now < new Date(c.startsAt)) return "scheduled";
  if (c.endsAt && now > new Date(c.endsAt)) return "expired";
  return "live";
}

const STATUS_STYLES: Record<CodeStatus, string> = {
  live: "text-emerald-500 border-emerald-500/30 bg-emerald-500/10",
  scheduled: "text-primary border-primary/30 bg-primary/10",
  expired: "text-muted-foreground border-border bg-background",
  exhausted: "text-muted-foreground border-border bg-background",
  inactive: "text-muted-foreground border-border bg-background",
};

interface FormState {
  code: string;
  description: string;
  type: "percent" | "fixed";
  value: string;
  minSubtotal: string;
  maxUses: string;
  startsAt: string;
  endsAt: string;
}

const emptyForm: FormState = {
  code: "", description: "", type: "percent", value: "",
  minSubtotal: "", maxUses: "", startsAt: "", endsAt: "",
};

function toIsoOrNull(local: string): string | null {
  return local ? new Date(local).toISOString() : null;
}

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminDiscounts() {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DiscountCode | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      const data = await apiFetch("/api/discounts");
      setCodes(data.codes ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load codes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
    setError("");
  };

  const openEdit = (c: DiscountCode) => {
    setEditing(c);
    setForm({
      code: c.code,
      description: c.description,
      type: c.type,
      value: String(c.value),
      minSubtotal: c.minSubtotal ? String(c.minSubtotal) : "",
      maxUses: c.maxUses !== null ? String(c.maxUses) : "",
      startsAt: toLocalInput(c.startsAt),
      endsAt: toLocalInput(c.endsAt),
    });
    setFormOpen(true);
    setError("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const body = {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim(),
      type: form.type,
      value: parseInt(form.value, 10),
      minSubtotal: form.minSubtotal ? parseInt(form.minSubtotal, 10) : 0,
      maxUses: form.maxUses ? parseInt(form.maxUses, 10) : null,
      startsAt: toIsoOrNull(form.startsAt),
      endsAt: toIsoOrNull(form.endsAt),
    };
    try {
      if (editing) {
        await apiFetch(`/api/discounts/${editing.id}`, { method: "PUT", body: JSON.stringify(body) });
      } else {
        await apiFetch("/api/discounts", { method: "POST", body: JSON.stringify(body) });
      }
      setFormOpen(false);
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (c: DiscountCode) => {
    try {
      await apiFetch(`/api/discounts/${c.id}`, { method: "PUT", body: JSON.stringify({ active: !c.active }) });
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Toggle failed");
    }
  };

  const handleDelete = async (c: DiscountCode) => {
    if (!confirm(`Delete code "${c.code}"? This cannot be undone.`)) return;
    try {
      await apiFetch(`/api/discounts/${c.id}`, { method: "DELETE" });
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleCopy = (c: DiscountCode) => {
    navigator.clipboard.writeText(c.code).then(() => {
      setCopiedId(c.id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  };

  const liveCount = codes.filter(c => codeStatus(c) === "live").length;
  const totalRedemptions = codes.reduce((s, c) => s + c.usedCount, 0);

  const inputCls = "w-full bg-background border border-border px-3 py-2.5 focus:outline-none focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground/50 text-sm";
  const labelCls = "block text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono mb-1.5";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif text-foreground mb-1">Discount <span className="italic">Codes</span></h1>
          <p className="text-muted-foreground text-sm">
            {codes.length} total · <span className="text-primary">{liveCount} live</span> · {totalRedemptions} redemptions
          </p>
        </div>
        <button
          onClick={formOpen ? () => setFormOpen(false) : openCreate}
          className="bg-primary text-primary-foreground px-5 py-3 flex items-center gap-2 hover:bg-primary/90 transition-colors uppercase tracking-widest text-xs font-semibold"
          data-testid="btn-add-discount"
        >
          {formOpen ? <X size={14} /> : <Plus size={14} />}
          {formOpen ? "Close" : "New Code"}
        </button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm flex items-center gap-2">
          <AlertTriangle size={14} />
          {error}
        </div>
      )}

      <AnimatePresence>
        {formOpen && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSave}
            className="bg-card border border-border overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-border">
              <span className="text-[10px] uppercase tracking-[0.25em] text-primary font-mono">
                {editing ? `Editing — ${editing.code}` : "New Discount Code"}
              </span>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className={labelCls}>Code *</label>
                <input required value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="WELCOME10" className={`${inputCls} font-mono tracking-wider`} data-testid="input-discount-code" />
              </div>
              <div>
                <label className={labelCls}>Type *</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as "percent" | "fixed" })}
                  className={inputCls}>
                  <option value="percent">Percent off</option>
                  <option value="fixed">Fixed amount off ($)</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>{form.type === "percent" ? "Percent *" : "Amount ($) *"}</label>
                <input required type="number" min={1} max={form.type === "percent" ? 100 : undefined}
                  value={form.value} onChange={e => setForm({ ...form, value: e.target.value })}
                  placeholder={form.type === "percent" ? "10" : "25"} className={inputCls} data-testid="input-discount-value" />
              </div>
              <div>
                <label className={labelCls}>Min. Subtotal ($)</label>
                <input type="number" min={0} value={form.minSubtotal}
                  onChange={e => setForm({ ...form, minSubtotal: e.target.value })}
                  placeholder="No minimum" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Max Uses</label>
                <input type="number" min={1} value={form.maxUses}
                  onChange={e => setForm({ ...form, maxUses: e.target.value })}
                  placeholder="Unlimited" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Starts</label>
                <input type="datetime-local" value={form.startsAt}
                  onChange={e => setForm({ ...form, startsAt: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Ends</label>
                <input type="datetime-local" value={form.endsAt}
                  onChange={e => setForm({ ...form, endsAt: e.target.value })} className={inputCls} />
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <label className={labelCls}>Description</label>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Internal note" className={inputCls} />
              </div>
            </div>
            <div className="px-6 pb-6 flex items-center gap-3">
              <button type="submit" disabled={saving}
                className="bg-primary text-primary-foreground px-6 py-2.5 uppercase tracking-widest text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                data-testid="btn-save-discount">
                {saving && <Loader2 size={12} className="animate-spin" />}
                {editing ? "Save Changes" : "Create Code"}
              </button>
              <button type="button" onClick={() => setFormOpen(false)}
                className="border border-border text-muted-foreground px-6 py-2.5 uppercase tracking-widest text-xs hover:border-primary hover:text-primary transition-colors">
                Cancel
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="grid grid-cols-1 gap-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-card border border-border animate-pulse" />)}
        </div>
      ) : codes.length === 0 ? (
        <div className="py-24 text-center bg-card border border-border">
          <Ticket size={40} className="text-border mx-auto mb-4" />
          <p className="font-serif text-lg text-foreground mb-2">No discount codes yet</p>
          <button onClick={openCreate} className="inline-block mt-2 text-primary hover:underline cursor-pointer text-sm">
            Create your first code
          </button>
        </div>
      ) : (
        <div className="bg-card border border-border overflow-x-auto">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-3 items-center px-4 py-3 border-b border-border bg-background">
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Code</span>
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-mono w-24 text-right">Discount</span>
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-mono w-28 text-center">Usage</span>
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-mono w-40 text-center">Window</span>
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-mono w-20 text-center">Status</span>
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-mono w-28 text-right">Actions</span>
            </div>
            <AnimatePresence initial={false}>
              {codes.map(c => {
                const status = codeStatus(c);
                return (
                  <motion.div key={c.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-3 items-center px-4 py-4 border-b border-border last:border-0 hover:bg-background/50 transition-colors"
                    data-testid={`row-discount-${c.id}`}>
                    <div className="min-w-0 flex items-center gap-2">
                      <button onClick={() => handleCopy(c)} title="Copy code"
                        className="text-muted-foreground hover:text-primary transition-colors shrink-0">
                        {copiedId === c.id ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                      </button>
                      <div className="min-w-0">
                        <p className="font-mono text-foreground tracking-wider truncate">{c.code}</p>
                        {c.description && <p className="text-xs text-muted-foreground truncate">{c.description}</p>}
                      </div>
                    </div>
                    <span className="font-mono text-foreground text-sm w-24 text-right">
                      {c.type === "percent" ? `${c.value}% off` : `$${c.value} off`}
                      {c.minSubtotal > 0 && <span className="block text-[10px] text-muted-foreground">min ${c.minSubtotal}</span>}
                    </span>
                    <span className="font-mono text-muted-foreground text-xs w-28 text-center">
                      {c.usedCount}{c.maxUses !== null ? ` / ${c.maxUses}` : " uses"}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono w-40 text-center leading-relaxed">
                      {c.startsAt || c.endsAt
                        ? `${c.startsAt ? new Date(c.startsAt).toLocaleDateString() : "now"} → ${c.endsAt ? new Date(c.endsAt).toLocaleDateString() : "∞"}`
                        : "Always on"}
                    </span>
                    <div className="w-20 flex justify-center">
                      <span className={`text-[9px] uppercase tracking-widest px-2 py-1 font-mono border ${STATUS_STYLES[status]}`}>
                        {status}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 w-28 justify-end">
                      <button onClick={() => handleToggle(c)} title={c.active ? "Deactivate" : "Activate"}
                        className={`w-8 h-8 flex items-center justify-center transition-colors ${c.active ? "text-emerald-500 hover:bg-emerald-500/10" : "text-muted-foreground hover:text-primary hover:bg-primary/10"}`}>
                        <Power size={13} />
                      </button>
                      <button onClick={() => openEdit(c)}
                        className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        data-testid={`btn-edit-discount-${c.id}`}>
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDelete(c)}
                        className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        data-testid={`btn-delete-discount-${c.id}`}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}

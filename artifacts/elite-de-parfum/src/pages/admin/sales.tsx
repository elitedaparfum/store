import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { useProducts } from "@/hooks/use-products";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Pencil, Trash2, BadgePercent, AlertTriangle,
  Power, X, Loader2,
} from "lucide-react";

export interface Sale {
  id: string;
  name: string;
  percent: number;
  scope: "all" | "family" | "gender";
  scopeValue: string;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
  createdAt: string;
}

type SaleStatus = "live" | "scheduled" | "ended" | "inactive";

export function saleStatus(s: Sale, now = new Date()): SaleStatus {
  if (!s.active) return "inactive";
  if (s.startsAt && now < new Date(s.startsAt)) return "scheduled";
  if (s.endsAt && now > new Date(s.endsAt)) return "ended";
  return "live";
}

const STATUS_STYLES: Record<SaleStatus, string> = {
  live: "text-emerald-500 border-emerald-500/30 bg-emerald-500/10",
  scheduled: "text-primary border-primary/30 bg-primary/10",
  ended: "text-muted-foreground border-border bg-background",
  inactive: "text-muted-foreground border-border bg-background",
};

interface FormState {
  name: string;
  percent: string;
  scope: "all" | "family" | "gender";
  scopeValue: string;
  startsAt: string;
  endsAt: string;
}

const emptyForm: FormState = {
  name: "", percent: "", scope: "all", scopeValue: "", startsAt: "", endsAt: "",
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

export default function AdminSales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Sale | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const { products } = useProducts();

  const families = [...new Set(products.map(p => p.family))].sort();
  const genders = [...new Set(products.map(p => p.gender))].sort();

  const refetch = useCallback(async () => {
    try {
      const data = await apiFetch("/api/sales");
      setSales(data.sales ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sales");
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

  const openEdit = (s: Sale) => {
    setEditing(s);
    setForm({
      name: s.name,
      percent: String(s.percent),
      scope: s.scope,
      scopeValue: s.scopeValue,
      startsAt: toLocalInput(s.startsAt),
      endsAt: toLocalInput(s.endsAt),
    });
    setFormOpen(true);
    setError("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const body = {
      name: form.name.trim(),
      percent: parseInt(form.percent, 10),
      scope: form.scope,
      scopeValue: form.scope === "all" ? "" : form.scopeValue,
      startsAt: toIsoOrNull(form.startsAt),
      endsAt: toIsoOrNull(form.endsAt),
    };
    try {
      if (editing) {
        await apiFetch(`/api/sales/${editing.id}`, { method: "PUT", body: JSON.stringify(body) });
      } else {
        await apiFetch("/api/sales", { method: "POST", body: JSON.stringify(body) });
      }
      setFormOpen(false);
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (s: Sale) => {
    try {
      await apiFetch(`/api/sales/${s.id}`, { method: "PUT", body: JSON.stringify({ active: !s.active }) });
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Toggle failed");
    }
  };

  const handleDelete = async (s: Sale) => {
    if (!confirm(`Delete sale "${s.name}"? Product prices revert immediately.`)) return;
    try {
      await apiFetch(`/api/sales/${s.id}`, { method: "DELETE" });
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const liveCount = sales.filter(s => saleStatus(s) === "live").length;

  const scopeLabel = (s: Sale) =>
    s.scope === "all" ? "Storewide" : `${s.scope === "family" ? "Family" : "Gender"}: ${s.scopeValue}`;

  const inputCls = "w-full bg-background border border-border px-3 py-2.5 focus:outline-none focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground/50 text-sm";
  const labelCls = "block text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono mb-1.5";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif text-foreground mb-1">Sales <span className="italic">Campaigns</span></h1>
          <p className="text-muted-foreground text-sm">
            {sales.length} total · <span className="text-primary">{liveCount} live now</span>
          </p>
        </div>
        <button
          onClick={formOpen ? () => setFormOpen(false) : openCreate}
          className="bg-primary text-primary-foreground px-5 py-3 flex items-center gap-2 hover:bg-primary/90 transition-colors uppercase tracking-widest text-xs font-semibold"
          data-testid="btn-add-sale"
        >
          {formOpen ? <X size={14} /> : <Plus size={14} />}
          {formOpen ? "Close" : "New Sale"}
        </button>
      </div>

      <div className="bg-muted/40 border border-border px-4 py-3 text-xs text-muted-foreground leading-relaxed">
        Live sales apply automatically to matching products across the storefront and cart.
        When a sale ends, prices revert on their own — nothing is written to the products themselves.
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
                {editing ? `Editing — ${editing.name}` : "New Sale Campaign"}
              </span>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Name *</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Summer Sale" className={inputCls} data-testid="input-sale-name" />
              </div>
              <div>
                <label className={labelCls}>Percent Off *</label>
                <input required type="number" min={1} max={90} value={form.percent}
                  onChange={e => setForm({ ...form, percent: e.target.value })}
                  placeholder="20" className={inputCls} data-testid="input-sale-percent" />
              </div>
              <div>
                <label className={labelCls}>Applies To *</label>
                <select value={form.scope}
                  onChange={e => setForm({ ...form, scope: e.target.value as FormState["scope"], scopeValue: "" })}
                  className={inputCls}>
                  <option value="all">Entire store</option>
                  <option value="family">A scent family</option>
                  <option value="gender">A gender collection</option>
                </select>
              </div>
              {form.scope !== "all" && (
                <div>
                  <label className={labelCls}>{form.scope === "family" ? "Scent Family *" : "Gender *"}</label>
                  <select required value={form.scopeValue}
                    onChange={e => setForm({ ...form, scopeValue: e.target.value })} className={inputCls}>
                    <option value="" disabled>Select…</option>
                    {(form.scope === "family" ? families : genders).map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
              )}
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
            </div>
            <div className="px-6 pb-6 flex items-center gap-3">
              <button type="submit" disabled={saving}
                className="bg-primary text-primary-foreground px-6 py-2.5 uppercase tracking-widest text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                data-testid="btn-save-sale">
                {saving && <Loader2 size={12} className="animate-spin" />}
                {editing ? "Save Changes" : "Launch Sale"}
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
      ) : sales.length === 0 ? (
        <div className="py-24 text-center bg-card border border-border">
          <BadgePercent size={40} className="text-border mx-auto mb-4" />
          <p className="font-serif text-lg text-foreground mb-2">No sales campaigns yet</p>
          <button onClick={openCreate} className="inline-block mt-2 text-primary hover:underline cursor-pointer text-sm">
            Launch your first sale
          </button>
        </div>
      ) : (
        <div className="bg-card border border-border overflow-x-auto">
          <div className="min-w-[700px]">
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-3 items-center px-4 py-3 border-b border-border bg-background">
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Sale</span>
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-mono w-20 text-right">Off</span>
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-mono w-36 text-center">Scope</span>
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-mono w-40 text-center">Window</span>
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-mono w-20 text-center">Status</span>
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-mono w-28 text-right">Actions</span>
            </div>
            <AnimatePresence initial={false}>
              {sales.map(s => {
                const status = saleStatus(s);
                return (
                  <motion.div key={s.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-3 items-center px-4 py-4 border-b border-border last:border-0 hover:bg-background/50 transition-colors"
                    data-testid={`row-sale-${s.id}`}>
                    <p className="font-serif text-foreground truncate">{s.name}</p>
                    <span className="font-mono text-primary text-sm w-20 text-right">−{s.percent}%</span>
                    <span className="text-xs text-muted-foreground w-36 text-center uppercase tracking-wider truncate">{scopeLabel(s)}</span>
                    <span className="text-[10px] text-muted-foreground font-mono w-40 text-center leading-relaxed">
                      {s.startsAt || s.endsAt
                        ? `${s.startsAt ? new Date(s.startsAt).toLocaleDateString() : "now"} → ${s.endsAt ? new Date(s.endsAt).toLocaleDateString() : "∞"}`
                        : "Always on"}
                    </span>
                    <div className="w-20 flex justify-center">
                      <span className={`text-[9px] uppercase tracking-widest px-2 py-1 font-mono border ${STATUS_STYLES[status]}`}>
                        {status}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 w-28 justify-end">
                      <button onClick={() => handleToggle(s)} title={s.active ? "Deactivate" : "Activate"}
                        className={`w-8 h-8 flex items-center justify-center transition-colors ${s.active ? "text-emerald-500 hover:bg-emerald-500/10" : "text-muted-foreground hover:text-primary hover:bg-primary/10"}`}>
                        <Power size={13} />
                      </button>
                      <button onClick={() => openEdit(s)}
                        className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        data-testid={`btn-edit-sale-${s.id}`}>
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDelete(s)}
                        className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        data-testid={`btn-delete-sale-${s.id}`}>
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

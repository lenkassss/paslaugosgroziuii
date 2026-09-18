import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listCatalogTree,
  createCatalogNode,
  updateCatalogNode,
  deleteCatalogNode,
  reorderCatalogNodes,
  type CatalogNode,
} from "@/lib/catalog.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { toastError } from "@/lib/error-messages";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Loader2,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/catalog")({
  component: CatalogAdmin,
});

const KINDS = [
  { value: "root", label: "Šaka (root)" },
  { value: "audience", label: "Auditorija" },
  { value: "category", label: "Kategorija" },
  { value: "subcategory", label: "Subkategorija" },
  { value: "service", label: "Paslauga" },
  { value: "filter_group", label: "Filtrų grupė" },
] as const;

function CatalogAdmin() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["catalog-tree", "admin"],
    queryFn: () => listCatalogTree({ data: { includeHidden: true } }),
  });

  const createFn = useServerFn(createCatalogNode);
  const updateFn = useServerFn(updateCatalogNode);
  const deleteFn = useServerFn(deleteCatalogNode);
  const reorderFn = useServerFn(reorderCatalogNodes);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["catalog-tree"] });

  type CreatePayload = { parent_id: string | null; label: string; slug: string; kind: "root" | "audience" | "category" | "subcategory" | "service" | "filter_group"; icon: string | null };
  type UpdatePayload = { id: string; label?: string; slug?: string; icon?: string | null; is_active?: boolean };

  const createMut = useMutation({
    mutationFn: (payload: CreatePayload) => createFn({ data: payload }),
    onSuccess: () => { toast.success("Pridėta"); invalidate(); },
    onError: (e) => toastError(e),
  });
  const updateMut = useMutation({
    mutationFn: (payload: UpdatePayload) => updateFn({ data: payload }),
    onSuccess: () => { toast.success("Atnaujinta"); invalidate(); },
    onError: (e) => toastError(e),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: (r) => { toast.success(`Ištrinta ${r.count} įrašų`); invalidate(); },
    onError: (e) => toastError(e),
  });
  const reorderMut = useMutation({
    mutationFn: (orders: Array<{ id: string; sort_order: number }>) => reorderFn({ data: { orders } }),
    onSuccess: () => invalidate(),
    onError: (e) => toastError(e),
  });

  const [addTo, setAddTo] = useState<CatalogNode | "root" | null>(null);
  const [editing, setEditing] = useState<CatalogNode | null>(null);

  const move = (siblings: CatalogNode[], id: string, dir: -1 | 1) => {
    const idx = siblings.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const target = idx + dir;
    if (target < 0 || target >= siblings.length) return;
    const swap = [siblings[idx], siblings[target]];
    reorderMut.mutate([
      { id: swap[0].id, sort_order: siblings[target].sort_order },
      { id: swap[1].id, sort_order: siblings[idx].sort_order },
    ]);
  };

  return (
    <DashboardShell>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl">Katalogo valdymas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pridėk / pervardink / paslėpk / ištrink paslaugų kategorijas. Vartotojai matys pakeitimus iš karto.
          </p>
        </div>
        <Button onClick={() => setAddTo("root")} className="gradient-gold text-primary-foreground btn-press">
          <Plus className="h-4 w-4 mr-1" /> Nauja šaka
        </Button>
      </div>

      <Card className="p-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground p-6">
            <Loader2 className="h-4 w-4 animate-spin" /> Kraunama...
          </div>
        ) : !data?.roots.length ? (
          <p className="text-sm text-muted-foreground p-4">Katalogas tuščias — pridėk pirmą šaką.</p>
        ) : (
          <div className="space-y-1">
            {data.roots.map((n) => (
              <TreeNode
                key={n.id}
                node={n}
                siblings={data.roots}
                depth={0}
                onAdd={setAddTo}
                onEdit={setEditing}
                onDelete={(id, label) => {
                  if (confirm(`Ištrinti „${label}" ir visus vaikinius mazgus?`)) deleteMut.mutate(id);
                }}
                onToggleActive={(node) => updateMut.mutate({ id: node.id, is_active: !(node.is_active ?? true) })}
                onMove={move}
              />
            ))}
          </div>
        )}
      </Card>

      <NodeDialog
        parent={addTo}
        onClose={() => setAddTo(null)}
        onSave={(payload) => {
          createMut.mutate(payload, { onSuccess: () => setAddTo(null) });
        }}
      />

      <EditDialog
        node={editing}
        onClose={() => setEditing(null)}
        onSave={(payload) => {
          updateMut.mutate(payload, { onSuccess: () => setEditing(null) });
        }}
      />
    </DashboardShell>
  );
}

function TreeNode({
  node,
  siblings,
  depth,
  onAdd,
  onEdit,
  onDelete,
  onToggleActive,
  onMove,
}: {
  node: CatalogNode;
  siblings: CatalogNode[];
  depth: number;
  onAdd: (n: CatalogNode) => void;
  onEdit: (n: CatalogNode) => void;
  onDelete: (id: string, label: string) => void;
  onToggleActive: (n: CatalogNode) => void;
  onMove: (siblings: CatalogNode[], id: string, dir: -1 | 1) => void;
}) {
  const [open, setOpen] = useState(depth < 1);
  const hasChildren = node.children.length > 0;
  const hidden = node.is_active === false;

  return (
    <div>
      <div
        className={`group flex items-center gap-1 rounded-md px-2 py-1.5 hover:bg-secondary/60 ${hidden ? "opacity-50" : ""}`}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
      >
        <button
          onClick={() => hasChildren && setOpen((v) => !v)}
          className="h-5 w-5 flex items-center justify-center text-muted-foreground"
          aria-label={open ? "Sutraukti" : "Išskleisti"}
        >
          {hasChildren ? (open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />) : <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />}
        </button>
        <span className="text-sm font-medium truncate flex-1">{node.label}</span>
        <Badge variant="outline" className="text-[10px] shrink-0">{node.kind}</Badge>
        <span className="text-[10px] text-muted-foreground shrink-0 hidden sm:inline">{node.slug}</span>
        <div className="ml-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
          <IconBtn title="Pridėti vaiką" onClick={() => onAdd(node)}><Plus className="h-3.5 w-3.5" /></IconBtn>
          <IconBtn title="Aukštyn" onClick={() => onMove(siblings, node.id, -1)}><ArrowUp className="h-3.5 w-3.5" /></IconBtn>
          <IconBtn title="Žemyn" onClick={() => onMove(siblings, node.id, 1)}><ArrowDown className="h-3.5 w-3.5" /></IconBtn>
          <IconBtn title={hidden ? "Rodyti" : "Paslėpti"} onClick={() => onToggleActive(node)}>
            {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </IconBtn>
          <IconBtn title="Redaguoti" onClick={() => onEdit(node)}><Pencil className="h-3.5 w-3.5" /></IconBtn>
          <IconBtn title="Ištrinti" onClick={() => onDelete(node.id, node.label)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></IconBtn>
        </div>
      </div>
      {open && hasChildren && (
        <div>
          {node.children.map((c) => (
            <TreeNode key={c.id} node={c} siblings={node.children} depth={depth + 1} onAdd={onAdd} onEdit={onEdit} onDelete={onDelete} onToggleActive={onToggleActive} onMove={onMove} />
          ))}
        </div>
      )}
    </div>
  );
}

function IconBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="h-6 w-6 inline-flex items-center justify-center rounded hover:bg-background border border-transparent hover:border-border"
    >
      {children}
    </button>
  );
}

function slugify(s: string) {
  return s.toLowerCase()
    .replace(/ą/g, "a").replace(/č/g, "c").replace(/ę/g, "e").replace(/ė/g, "e")
    .replace(/į/g, "i").replace(/š/g, "s").replace(/ų/g, "u").replace(/ū/g, "u").replace(/ž/g, "z")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

function NodeDialog({
  parent,
  onClose,
  onSave,
}: {
  parent: CatalogNode | "root" | null;
  onClose: () => void;
  onSave: (payload: { parent_id: string | null; label: string; slug: string; kind: "root" | "audience" | "category" | "subcategory" | "service" | "filter_group"; icon: string | null }) => void;
}) {
  const [label, setLabel] = useState("");
  const [slug, setSlug] = useState("");
  const [kind, setKind] = useState<typeof KINDS[number]["value"]>("category");
  const [icon, setIcon] = useState("");

  const open = parent !== null;
  const parentLabel = parent === "root" ? "Šaknis" : parent?.label;

  const autoSlug = useMemo(() => slugify(label), [label]);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); setLabel(""); setSlug(""); setIcon(""); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Naujas mazgas {parentLabel && <span className="text-sm text-muted-foreground">→ {parentLabel}</span>}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Pavadinimas</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="pvz. Manikiūras" />
          </div>
          <div>
            <Label>Slug (URL adresas)</Label>
            <Input value={slug || autoSlug} onChange={(e) => setSlug(e.target.value)} placeholder={autoSlug || "manikiuras"} />
          </div>
          <div>
            <Label>Tipas</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as typeof kind)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {KINDS.map((k) => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Ikona (lucide vardas, pasirinktinai)</Label>
            <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="pvz. scissors, sparkles" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Atšaukti</Button>
          <Button
            onClick={() => {
              if (!label.trim()) return toast.error("Pavadinimas privalomas");
              const finalSlug = (slug || autoSlug).trim();
              if (!finalSlug) return toast.error("Slug privalomas");
              onSave({
                parent_id: parent === "root" ? null : parent!.id,
                label: label.trim(),
                slug: finalSlug,
                kind,
                icon: icon.trim() || null,
              });
              setLabel(""); setSlug(""); setIcon("");
            }}
            className="gradient-gold text-primary-foreground"
          >
            Pridėti
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditDialog({
  node,
  onClose,
  onSave,
}: {
  node: CatalogNode | null;
  onClose: () => void;
  onSave: (payload: { id: string; label: string; slug: string; icon: string | null }) => void;
}) {
  const [label, setLabel] = useState("");
  const [slug, setSlug] = useState("");
  const [icon, setIcon] = useState("");

  const open = node !== null;

  // Sync when node changes
  useMemo(() => {
    if (node) {
      setLabel(node.label);
      setSlug(node.slug);
      setIcon(node.icon ?? "");
    }
  }, [node]);

  if (!node) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Redaguoti: {node.label}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div><Label>Pavadinimas</Label><Input value={label} onChange={(e) => setLabel(e.target.value)} /></div>
          <div><Label>Slug</Label><Input value={slug} onChange={(e) => setSlug(e.target.value)} /></div>
          <div><Label>Ikona</Label><Input value={icon} onChange={(e) => setIcon(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Atšaukti</Button>
          <Button
            onClick={() => {
              if (!label.trim()) return toast.error("Pavadinimas privalomas");
              onSave({ id: node.id, label: label.trim(), slug: slug.trim() || node.slug, icon: icon.trim() || null });
            }}
            className="gradient-gold text-primary-foreground"
          >
            Išsaugoti
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

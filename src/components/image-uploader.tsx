import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { usePhotoPermissionGate } from "@/components/photo-permission-gate";
import { toastError } from "@/lib/error-messages";

type Bucket = "avatars" | "covers" | "gallery";

/** Rekomenduojamas minimalus nuotraukos kraštas (px) – kad darbai atrodytų kokybiškai. */
export const MIN_PHOTO_EDGE = 800;
export const PHOTO_HINT = `Rekomenduojame min. ${MIN_PHOTO_EDGE}×${MIN_PHOTO_EDGE} px, iki 5 MB. Geriausiai – ryški, gerai apšviesta nuotrauka be filtrų.`;

/** Tikrina dydį ir mandagiai įspėja, jei nuotrauka per maža (įkėlimo nestabdo). */
async function warnIfSmall(file: File) {
  try {
    const bmp = await createImageBitmap(file);
    const edge = Math.min(bmp.width, bmp.height);
    bmp.close?.();
    if (edge < MIN_PHOTO_EDGE) {
      toast.warning(`Nuotrauka nedidelė (${bmp.width}×${bmp.height} px). Rekomenduojame bent ${MIN_PHOTO_EDGE} px kraštą.`);
    }
  } catch {
    // Jei naršyklė nepalaiko – tyliai praleidžiam.
  }
}

async function uploadToBucket(bucket: Bucket, userId: string, file: File): Promise<string> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: false,
    cacheControl: "3600",
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export function SingleImageUploader({
  bucket,
  value,
  onChange,
  aspect = "square",
  label,
}: {
  bucket: Bucket;
  value: string;
  onChange: (url: string) => void;
  aspect?: "square" | "wide";
  label: string;
}) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { guard, dialog } = usePhotoPermissionGate();

  const onFile = async (file: File | null) => {
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Nuotrauka per didelė (max 5MB)");
      return;
    }
    setBusy(true);
    try {
      await warnIfSmall(file);
      const url = await uploadToBucket(bucket, user.id, file);
      onChange(url);
      toast.success("Įkelta");
    } catch (e) {
      toastError(e);
    } finally {
      setBusy(false);
    }
  };

  const box = aspect === "square" ? "aspect-square" : "aspect-[3/1]";

  return (
    <div>
      <div className="text-sm font-medium mb-2">{label}</div>
      <div className={`relative ${box} rounded-lg border-2 border-dashed border-border overflow-hidden bg-secondary/30 flex items-center justify-center group`}>
        {value ? (
          <>
            <img src={value} alt={label} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
              <Button type="button" size="sm" variant="secondary" onClick={() => guard(() => inputRef.current?.click())}>
                <Upload className="h-3 w-3 mr-1" /> Pakeisti
              </Button>
              <Button type="button" size="sm" variant="destructive" onClick={() => onChange("")}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          </>
        ) : (
          <button type="button" onClick={() => guard(() => inputRef.current?.click())} className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition p-6">
            {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImagePlus className="h-6 w-6" />}
            <span className="text-xs">{busy ? "Įkeliama..." : "Įkelk nuotrauką"}</span>
          </button>
        )}
      </div>
      <p className="mt-2 text-[11px] leading-snug text-muted-foreground">{PHOTO_HINT}</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
      {dialog}
    </div>
  );
}

export function GalleryUploader({
  values,
  onChange,
}: {
  values: string[];
  onChange: (urls: string[]) => void;
}) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { guard, dialog } = usePhotoPermissionGate();

  const onFiles = async (files: FileList | null) => {
    if (!files || !user) return;
    setBusy(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} per didelė (max 5MB)`);
          continue;
        }
        await warnIfSmall(file);
        uploaded.push(await uploadToBucket("gallery", user.id, file));
      }
      if (uploaded.length) {
        onChange([...values, ...uploaded]);
        toast.success(`Įkelta ${uploaded.length}`);
      }
    } catch (e) {
      toastError(e);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <div className="text-sm font-medium mb-2">Galerija ({values.length})</div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {values.map((url, i) => (
          <div key={url} className="relative aspect-square rounded-md overflow-hidden border border-border group">
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(values.filter((_, idx) => idx !== i))}
              className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
              aria-label="Šalinti"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => guard(() => inputRef.current?.click())}
          disabled={busy}
          className="aspect-square rounded-md border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary hover:border-primary transition"
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
          <span className="text-[10px]">Pridėti</span>
        </button>
      </div>
      <p className="mt-2 text-[11px] leading-snug text-muted-foreground">{PHOTO_HINT}</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => onFiles(e.target.files)}
      />
      {dialog}
    </div>
  );
}

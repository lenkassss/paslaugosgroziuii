import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function publicClient() {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(process.env.SUPABASE_URL!, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const h = new Headers(init?.headers);
      if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
      h.set("apikey", key);
      return fetch(input, { ...init, headers: h });
    } },
  });
}

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "darbas";
}

export const EMPLOYMENT_TYPES = [
  { v: "full_time", l: "Pilnas etatas" },
  { v: "part_time", l: "Dalinis etatas" },
  { v: "rent_chair", l: "Vietos/kėdės nuoma" },
  { v: "freelance", l: "Freelance" },
  { v: "internship", l: "Praktika" },
];

export const listJobs = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({
    city: z.string().optional(),
    type: z.string().optional(),
    q: z.string().optional(),
  }).parse(d ?? {}))
  .handler(async ({ data }) => {
    const s = publicClient();
    let q = s.from("job_listings")
      .select("id,slug,title,city,employment_type,salary_from,salary_to,currency,description,created_at,employer_id,profiles:employer_id(business_name,avatar_url,verification_status,city)")
      .eq("is_active", true);
    if (data.city) q = q.ilike("city", `%${data.city}%`);
    if (data.type) q = q.eq("employment_type", data.type);
    if (data.q) q = q.ilike("title", `%${data.q}%`);
    const { data: rows, error } = await q.order("created_at", { ascending: false }).limit(100);
    if (error) throw new Error(error.message);
    return { jobs: rows ?? [] };
  });

export const getJob = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const s = publicClient();
    const { data: job, error } = await s.from("job_listings")
      .select("*,profiles:employer_id(business_name,avatar_url,verification_status,city,phone,email)")
      .eq("slug", data.slug).maybeSingle();
    if (error) throw new Error(error.message);
    if (!job) throw new Error("Skelbimas nerastas");
    return { job };
  });

export const upsertJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid().optional(),
    title: z.string().min(3).max(160),
    city: z.string().optional().default(""),
    employment_type: z.string().default("full_time"),
    salary_from: z.number().optional().nullable(),
    salary_to: z.number().optional().nullable(),
    description: z.string().min(20),
    requirements: z.string().optional().default(""),
    benefits: z.string().optional().default(""),
    contact_email: z.string().optional().default(""),
    contact_phone: z.string().optional().default(""),
    is_active: z.boolean().default(true),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const base = {
      title: data.title, city: data.city || null,
      employment_type: data.employment_type,
      salary_from: data.salary_from ?? null, salary_to: data.salary_to ?? null,
      description: data.description, requirements: data.requirements || null,
      benefits: data.benefits || null,
      contact_email: data.contact_email || null, contact_phone: data.contact_phone || null,
      is_active: data.is_active,
    };
    if (data.id) {
      const { error } = await context.supabase.from("job_listings").update(base).eq("id", data.id).eq("employer_id", context.userId);
      if (error) throw new Error(error.message);
      return { id: data.id, ok: true };
    }
    const { data: row, error } = await context.supabase.from("job_listings")
      .insert({ ...base, employer_id: context.userId, slug: `${slugify(data.title)}-${Math.random().toString(36).slice(2, 7)}` })
      .select("id, slug").maybeSingle();
    if (error) throw new Error(error.message);
    return { id: row?.id, slug: row?.slug, ok: true };
  });

export const deleteJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("job_listings").delete().eq("id", data.id).eq("employer_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMyJobs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("job_listings").select("*").eq("employer_id", context.userId).order("created_at", { ascending: false });
    return { jobs: data ?? [] };
  });

export const applyToJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    job_id: z.string().uuid(),
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional().default(""),
    message: z.string().min(10),
    cv_url: z.string().optional().default(""),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await context.supabase.from("job_applications").insert({
      job_id: data.job_id, applicant_id: context.userId,
      name: data.name, email: data.email, phone: data.phone || null,
      message: data.message, cv_url: data.cv_url || null,
    });
    if (error) throw new Error(error.message);
    // Increment counter + notify employer
    const { data: job } = await supabaseAdmin.from("job_listings").select("employer_id, title, applications_count").eq("id", data.job_id).maybeSingle();
    if (job) {
      await supabaseAdmin.from("job_listings").update({ applications_count: (job.applications_count ?? 0) + 1 }).eq("id", data.job_id);
      await supabaseAdmin.from("notifications").insert({
        user_id: job.employer_id, type: "system",
        payload: { kind: "job_application", job_id: data.job_id, job_title: job.title, applicant: data.name },
      });
    }
    return { ok: true };
  });

export const listJobApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ job_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: apps, error } = await context.supabase.from("job_applications").select("*").eq("job_id", data.job_id).order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { applications: apps ?? [] };
  });

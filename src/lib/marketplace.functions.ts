import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PLATFORM_FEE_PER_ORDER = 0.49;
const PRODUCT_LIMIT_PER_SUPPLIER = 10000;

function slugify(s: string) {
  return s.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "prekes";
}

// ============================================================
// TIEKĖJŲ KATALOGAS — uždarytas B2B skiltis. RLS leidžia matyti
// prekes tik verslo rolėms (meistrė, salonas, tiekėjas, mokykla, admin).
// ============================================================
export const listMarketplaceProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    q: z.string().optional(),
    category: z.string().optional(),
    brand: z.string().optional(),
    sort: z.enum(["new", "price_asc", "price_desc"]).default("new"),
    limit: z.number().int().min(1).max(60).default(24),
    offset: z.number().int().min(0).default(0),
  }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    let q = context.supabase.from("products")
      .select("id,slug,title,description,price,price_retail,price_wholesale,currency,images,category,brand,stock,discount_percent,supplier_id,created_at")
      .eq("is_active", true);
    if (data.q) q = q.ilike("title", `%${data.q.replace(/[%_]/g, "")}%`);
    if (data.category) q = q.eq("category", data.category);
    if (data.brand) q = q.eq("brand", data.brand);
    if (data.sort === "price_asc") q = q.order("price_retail", { ascending: true, nullsFirst: false });
    else if (data.sort === "price_desc") q = q.order("price_retail", { ascending: false, nullsFirst: false });
    else q = q.order("created_at", { ascending: false });
    q = q.range(data.offset, data.offset + data.limit - 1);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { items: rows ?? [] };
  });

export const getMarketplaceProduct = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: p, error } = await context.supabase.from("products")
      .select("id,slug,title,description,price,price_retail,price_wholesale,currency,images,category,brand,stock,discount_percent,supplier_id,is_active,inci,volume,usage_instructions,country_of_origin")
      .eq("slug", data.slug).eq("is_active", true).maybeSingle();
    if (error) throw new Error(error.message);
    if (!p) throw new Error("Prekė nerasta");
    return { product: p };
  });

export const listMarketplaceFacets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("products")
      .select("category,brand").eq("is_active", true).limit(5000);
    const cats = new Set<string>(), brands = new Set<string>();
    for (const r of data ?? []) {
      if (r.category) cats.add(r.category);
      if (r.brand) brands.add(r.brand);
    }
    return { categories: [...cats].sort(), brands: [...brands].sort() };
  });

// ============================================================
// SUPPLIER CRUD
// ============================================================
export const listMyProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("products")
      .select("id,slug,title,price,price_retail,price_wholesale,currency,images,stock,is_active,category,brand,discount_percent,created_at")
      .eq("supplier_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { items: data ?? [] };
  });

const productInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(2).max(200),
  description: z.string().max(4000).default(""),
  price: z.number().min(0).default(0), // legacy — used as wholesale fallback
  price_retail: z.number().min(0).optional(),
  price_wholesale: z.number().min(0).optional(),
  currency: z.string().default("EUR"),
  images: z.array(z.string()).default([]),
  category: z.string().max(120).default(""),
  brand: z.string().max(120).default(""),
  brand_id: z.string().uuid().nullable().optional(),
  stock: z.number().int().min(0).default(0),
  discount_percent: z.number().int().min(0).max(90).default(0),
  is_active: z.boolean().default(true),
});

export const upsertProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => productInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: isSupplier } = await context.supabase.rpc("has_role", {
      _user_id: context.userId, _role: "supplier",
    });
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId, _role: "admin",
    });
    if (!isSupplier && !isAdmin) throw new Error("Reikia tiekėjo paskyros");

    // 10 000 product cap per supplier — only enforced on new inserts.
    if (!data.id) {
      const { count } = await context.supabase.from("products")
        .select("id", { count: "exact", head: true })
        .eq("supplier_id", context.userId);
      if ((count ?? 0) >= PRODUCT_LIMIT_PER_SUPPLIER) {
        throw new Error(`Pasiektas ${PRODUCT_LIMIT_PER_SUPPLIER} prekių limitas tiekėjui`);
      }
    }

    let brandName = data.brand;
    if (data.brand_id) {
      const { data: b } = await context.supabase.from("global_brands").select("name").eq("id", data.brand_id).maybeSingle();
      if (b?.name) brandName = b.name;
    }

    // Two prices: wholesale is source of truth (also stored in legacy `price`).
    const wholesale = data.price_wholesale ?? data.price ?? 0;
    const retail = data.price_retail ?? Math.round(wholesale * 1.30 * 100) / 100;

    const base = {
      supplier_id: context.userId,
      title: data.title,
      description: data.description,
      price: wholesale,
      price_wholesale: wholesale,
      price_retail: retail,
      currency: data.currency,
      images: data.images,
      category: data.category || null,
      brand: brandName || null,
      brand_id: data.brand_id ?? null,
      stock: data.stock,
      discount_percent: data.discount_percent,
      is_active: data.is_active,
    };

    if (data.id) {
      const { error } = await context.supabase.from("products")
        .update(base).eq("id", data.id).eq("supplier_id", context.userId);
      if (error) throw new Error(error.message);
      return { id: data.id, ok: true };
    }
    const slug = `${slugify(data.title)}-${Math.random().toString(36).slice(2, 7)}`;
    const { data: row, error } = await context.supabase.from("products")
      .insert({ ...base, slug }).select("id,slug").maybeSingle();
    if (error) throw new Error(error.message);
    return { id: row?.id, slug: row?.slug, ok: true };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("products")
      .delete().eq("id", data.id).eq("supplier_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============================================================
// CHECKOUT — open to any logged-in role. Wholesale for pros, retail for clients.
// ============================================================
const cartItem = z.object({ productId: z.string().uuid(), qty: z.number().int().min(1).max(50) });
const shipping = z.object({
  full_name: z.string().min(2),
  phone: z.string().min(6),
  email: z.string().email(),
  address: z.string().min(4),
  city: z.string().min(1),
  postal_code: z.string().min(3),
  notes: z.string().max(500).optional(),
});

export const createMarketplaceOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    items: z.array(cartItem).min(1),
    shipping,
    cardNumber: z.string().default("4242 4242 4242 4242"),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const digits = data.cardNumber.replace(/\s/g, "");
    if (digits !== "4242424242424242") throw new Error("DEMO_INVALID_CARD");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Determine buyer pricing tier from their roles.
    const { data: buyerRoles } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", context.userId);
    const isPro = (buyerRoles ?? []).some((r) => ["salon", "staff", "supplier", "admin", "super_admin"].includes(r.role as string));

    const ids = data.items.map(i => i.productId);
    const { data: prods, error: pErr } = await supabaseAdmin.from("products")
      .select("id,supplier_id,title,price,price_retail,price_wholesale,discount_percent,stock,is_active,currency").in("id", ids);
    if (pErr) throw new Error(pErr.message);
    if (!prods || prods.length !== ids.length) throw new Error("Kai kurių prekių nebėra");

    const groups: Record<string, Array<{ p: typeof prods[number]; qty: number }>> = {};
    for (const it of data.items) {
      const p = prods.find(x => x.id === it.productId)!;
      if (!p.is_active) throw new Error(`Prekė nebeaktyvi: ${p.title}`);
      if (p.stock < it.qty) throw new Error(`Nebeturime "${p.title}" tokio kiekio`);
      (groups[p.supplier_id] ??= []).push({ p, qty: it.qty });
    }

    const priceOf = (p: typeof prods[number]) => {
      const base = isPro
        ? Number(p.price_wholesale ?? p.price)
        : Number(p.price_retail ?? Number(p.price) * 1.30);
      return base * (1 - (p.discount_percent || 0) / 100);
    };

    const orderIds: string[] = [];
    let grandTotal = 0;

    for (const [supplierId, rows] of Object.entries(groups)) {
      let subtotal = 0;
      for (const { p, qty } of rows) subtotal += priceOf(p) * qty;
      subtotal = Math.round(subtotal * 100) / 100;
      const total = Math.round((subtotal + PLATFORM_FEE_PER_ORDER) * 100) / 100;
      grandTotal += total;

      const { data: pay } = await supabaseAdmin.from("demo_payments").insert({
        user_id: context.userId,
        amount: total,
        card_last4: digits.slice(-4),
        status: "succeeded",
        kind: "product",
        meta: { supplier_id: supplierId, tier: isPro ? "b2b" : "b2c" },
      }).select("id").maybeSingle();

      const { data: order, error: oErr } = await supabaseAdmin.from("orders").insert({
        buyer_id: context.userId,
        supplier_id: supplierId,
        status: "paid",
        subtotal,
        platform_fee: PLATFORM_FEE_PER_ORDER,
        total,
        shipping_address: data.shipping,
        contact_phone: data.shipping.phone,
        contact_email: data.shipping.email,
        payment_id: pay?.id ?? null,
        notes: data.shipping.notes ?? null,
      }).select("id").maybeSingle();
      if (oErr || !order) throw new Error(oErr?.message ?? "Nepavyko sukurti užsakymo");
      orderIds.push(order.id);

      const items = rows.map(({ p, qty }) => ({
        order_id: order.id,
        product_id: p.id,
        snapshot_title: p.title,
        qty,
        unit_price: Math.round(priceOf(p) * 100) / 100,
      }));
      const { error: iErr } = await supabaseAdmin.from("order_items").insert(items);
      if (iErr) throw new Error(iErr.message);

      for (const { p, qty } of rows) {
        await supabaseAdmin.from("products").update({ stock: p.stock - qty }).eq("id", p.id);
      }

      await supabaseAdmin.from("notifications").insert({
        user_id: supplierId,
        type: "comment_on_article",
        payload: { kind: "new_order", order_id: order.id, total, items: rows.length },
      });
    }

    return { ok: true, orderIds, total: Math.round(grandTotal * 100) / 100 };
  });

export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("orders")
      .select("id,status,subtotal,platform_fee,total,created_at,supplier_id,profiles:supplier_id(business_name),order_items(qty,snapshot_title,unit_price)")
      .eq("buyer_id", context.userId)
      .order("created_at", { ascending: false }).limit(50);
    if (error) throw new Error(error.message);
    return { orders: data ?? [] };
  });

export const listSupplierOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("orders")
      .select("id,status,subtotal,platform_fee,total,created_at,buyer_id,contact_email,contact_phone,shipping_address,order_items(qty,snapshot_title,unit_price)")
      .eq("supplier_id", context.userId)
      .order("created_at", { ascending: false }).limit(100);
    if (error) throw new Error(error.message);
    return { orders: data ?? [] };
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    orderId: z.string().uuid(),
    status: z.enum(["paid", "shipped", "delivered", "cancelled"]),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("orders")
      .update({ status: data.status }).eq("id", data.orderId)
      .eq("supplier_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

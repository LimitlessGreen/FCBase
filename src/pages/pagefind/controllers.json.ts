import { getCollection } from "astro:content";

export const prerender = true;

const bucketizeUarts = (count: number): string => {
  if (!Number.isFinite(count)) {
    return "unknown";
  }
  if (count <= 4) return "0-4";
  if (count <= 6) return "5-6";
  if (count <= 8) return "7-8";
  if (count <= 10) return "9-10";
  return "11+";
};

const dedupe = <T>(values: Array<T | null | undefined>): T[] => {
  return Array.from(new Set(values.filter((value): value is T => Boolean(value))));
};

const normalizeLifecycle = (value: unknown): string => {
  if (!value) return "unknown";
  return String(value).toLowerCase();
};

const normalizeMcuFamily = (value: unknown): string => {
  if (!value) return "Unknown";
  const trimmed = String(value).trim();
  if (!trimmed) return "Unknown";
  if (/^stm32/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  return trimmed;
};

const resolveLifecycle = (controller: Record<string, any>): unknown => {
  if (controller?.lifecycle) return controller.lifecycle;
  if (controller?.hardware?.lifecycle) return controller.hardware.lifecycle;
  if (controller?.product?.lifecycle) return controller.product.lifecycle;
  return undefined;
};

export async function GET() {
  const [controllers, manufacturers, mcuCollection] = await Promise.all([
    getCollection("controllers"),
    getCollection("manufacturers"),
    getCollection("mcu"),
  ]);

  const manufacturerMap = new Map(
    manufacturers.map((entry) => [entry.id, entry.data as Record<string, any>])
  );
  const mcuMap = new Map(mcuCollection.map((entry) => [entry.id, entry.data as Record<string, any>]));

  const records = controllers.map((entry) => {
    const data = entry.data as Record<string, any>;
    const manufacturer = data.brand ? manufacturerMap.get(data.brand) : undefined;
    const brandName = manufacturer?.name || manufacturer?.title || data.brand || "";

    const mcu = data.mcu ? mcuMap.get(data.mcu) : undefined;
    const mcuFamilyRaw = mcu?.family ?? data.mcu_family ?? "";
    const mcuFamily = normalizeMcuFamily(mcuFamilyRaw);
    const mcuName = mcu?.name || mcu?.title || data.mcu || "";

    const firmwareSupport = Array.isArray(data.firmware_support) ? data.firmware_support : [];
    const firmwareStatuses = dedupe(
      firmwareSupport.map((support) =>
        support?.status ? String(support.status) : null
      )
    );
    const firmwareIds = dedupe(
      firmwareSupport.map((support) => (support?.id ? String(support.id) : null))
    );

    const keywordList = Array.isArray(data.seo?.keywords) && data.seo?.keywords.length
      ? data.seo.keywords
      : Array.isArray(data.keywords)
        ? data.keywords
        : [];

    const summary = typeof data.seo?.summary === "string" ? data.seo.summary : "";
    const notes = typeof data.notes === "string" ? data.notes : "";
    const features = Array.isArray(data.features) ? data.features : [];

    const lifecycle = normalizeLifecycle(resolveLifecycle(data));
    const uartsCount = typeof data.io?.uarts === "number" ? data.io.uarts : null;
    const canCount = typeof data.io?.can === "number" ? data.io.can : 0;
    const sdCard = data.io?.sd_card === true;

    const filters: Record<string, string[]> = {
      lifecycle: [lifecycle],
      can: [canCount > 0 ? "1" : "0"],
      sd: [sdCard ? "1" : "0"],
    };

    if (mcuFamily) {
      filters.mcu = [mcuFamily];
    }
    if (data.mounting) {
      filters.mounting = [String(data.mounting)];
    }
    if (uartsCount !== null) {
      filters.uarts = [bucketizeUarts(uartsCount)];
    }
    if (firmwareStatuses.length > 0) {
      filters.firmware = firmwareStatuses.map(String);
    }

    return {
      id: data.id,
      slug: entry.slug,
      title: data.title ?? "",
      brand: data.brand ?? "",
      brand_name: brandName,
      model: data.model ?? data.title ?? "",
      mcu: data.mcu ?? "",
      mcu_name: mcuName,
      mcu_family: mcuFamily,
      mounting: data.mounting ?? "",
      uarts: uartsCount,
      can: canCount,
      sd: sdCard,
      firmware_ids: firmwareIds,
      firmware_statuses: firmwareStatuses,
      lifecycle,
      summary,
      notes,
      keywords: keywordList,
      features,
      url: `/controllers/${entry.slug}/`,
      filters,
    };
  });

  records.sort((a, b) => a.title.localeCompare(b.title));

  const body = JSON.stringify(records, null, 2);

  return new Response(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
    },
  });
}

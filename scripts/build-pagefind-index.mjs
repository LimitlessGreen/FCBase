import { createIndex } from 'pagefind';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import YAML from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const contentRoot = path.join(repoRoot, 'src', 'content');
const controllersDir = path.join(contentRoot, 'controllers');
const mcuDir = path.join(contentRoot, 'mcu');
const manufacturersDir = path.join(contentRoot, 'manufacturers');

const bucketizeUarts = (count) => {
  if (typeof count !== 'number' || Number.isNaN(count)) {
    return 'unknown';
  }
  if (count <= 4) return '0-4';
  if (count <= 6) return '5-6';
  if (count <= 8) return '7-8';
  if (count <= 10) return '9-10';
  return '11+';
};

const normalizeLifecycle = (value) => {
  if (!value) return 'unknown';
  return String(value).toLowerCase();
};

const normalizeMcuFamily = (value) => {
  if (!value) return 'Unknown';
  const trimmed = value.trim();
  if (/^stm32/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  return trimmed;
};

async function readYamlFile(filePath) {
  const content = await readFile(filePath, 'utf8');
  return YAML.parse(content);
}

async function readYamlDirectory(rootDir) {
  const entries = await readdir(rootDir, { withFileTypes: true });
  const items = [];
  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      const nested = await readYamlDirectory(fullPath);
      items.push(...nested);
    } else if (entry.isFile() && entry.name.endsWith('.yaml')) {
      items.push({
        filePath: fullPath,
        relativePath: path.relative(controllersDir, fullPath),
        data: await readYamlFile(fullPath),
      });
    }
  }
  return items;
}

async function loadManufacturers() {
  const entries = await readdir(manufacturersDir, { withFileTypes: true });
  const map = new Map();
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.yaml')) continue;
    const data = await readYamlFile(path.join(manufacturersDir, entry.name));
    if (data?.id) {
      map.set(data.id, data);
    }
  }
  return map;
}

async function loadMcuFamilies() {
  const entries = await readdir(mcuDir, { withFileTypes: true });
  const map = new Map();
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.yaml')) continue;
    const data = await readYamlFile(path.join(mcuDir, entry.name));
    if (data?.id) {
      map.set(data.id, data);
    }
  }
  return map;
}

const dedupe = (values) => {
  return Array.from(new Set(values.filter(Boolean)));
};

const buildContent = (controller) => {
  const parts = [];
  parts.push(controller.title);
  parts.push(controller.brandName);
  parts.push(controller.model);
  parts.push(...controller.keywordList);
  if (controller.summary) parts.push(controller.summary);
  if (controller.features?.length) {
    parts.push(controller.features.join(' '));
  }
  if (controller.notes) parts.push(controller.notes);
  return parts
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean)
    .join('\n');
};

function getLifecycle(controllerData) {
  if (controllerData?.lifecycle) return controllerData.lifecycle;
  if (controllerData?.hardware?.lifecycle) return controllerData.hardware.lifecycle;
  if (controllerData?.product?.lifecycle) return controllerData.product.lifecycle;
  return undefined;
}

export async function buildControllerPagefindIndex({ outputDir }) {
  const manufacturerMap = await loadManufacturers();
  const mcuMap = await loadMcuFamilies();
  const controllers = await readYamlDirectory(controllersDir);
  const { index } = await createIndex({ forceLanguage: 'en' });
  const records = [];

  for (const controllerFile of controllers) {
    const data = controllerFile.data ?? {};
    if (!data.id) {
      console.warn(`Skipping controller without id in ${controllerFile.filePath}`);
      continue;
    }

    const slug = controllerFile.relativePath
      .replace(/\\/g, '/')
      .replace(/\.yaml$/i, '');
    const normalizedSlug = slug.replace(/\/?index$/i, '');
    const url = `/controllers/${normalizedSlug}/`;

    const manufacturer = data.brand ? manufacturerMap.get(data.brand) : undefined;
    const brandName = manufacturer?.name || manufacturer?.title || data.brand || '';
    const mcu = data.mcu ? mcuMap.get(data.mcu) : undefined;
    const mcuFamilyRaw = mcu?.family || data.mcu_family || '';
    const mcuFamily = normalizeMcuFamily(mcuFamilyRaw);
    const mcuName = mcu?.name || mcu?.title || data.mcu;

    const firmwareStatuses = dedupe(
      Array.isArray(data.firmware_support)
        ? data.firmware_support.map((fw) => fw?.status).filter(Boolean)
        : []
    );
    const firmwareIds = Array.isArray(data.firmware_support)
      ? data.firmware_support.map((fw) => fw?.id).filter(Boolean)
      : [];

    const keywordList = Array.isArray(data.seo?.keywords) && data.seo?.keywords.length
      ? data.seo.keywords
      : Array.isArray(data.keywords)
        ? data.keywords
        : [];

    const summary = typeof data.seo?.summary === 'string' ? data.seo.summary : '';
    const notes = typeof data.notes === 'string' ? data.notes : '';
    const features = Array.isArray(data.features) ? data.features : [];

    const lifecycleRaw = getLifecycle(data);
    const lifecycle = normalizeLifecycle(lifecycleRaw);
    const uartsCount = typeof data.io?.uarts === 'number' ? data.io.uarts : undefined;
    const canCount = typeof data.io?.can === 'number' ? data.io.can : 0;
    const sdCard = data.io?.sd_card === true;

    const meta = {
      id: data.id,
      slug,
      title: data.title ?? '',
      brand: data.brand ?? '',
      brand_name: brandName,
      model: data.model ?? data.title ?? '',
      mcu: data.mcu ?? '',
      mcu_name: mcuName ?? '',
      mcu_family: mcuFamily,
      mounting: data.mounting ?? '',
      uarts: uartsCount !== undefined ? String(uartsCount) : '',
      can: String(canCount ?? 0),
      sd: sdCard ? '1' : '0',
      firmware_ids: firmwareIds.join(','),
      firmware_statuses: firmwareStatuses.join(','),
      lifecycle,
      summary,
      keywords: keywordList.join(', '),
      notes,
      features: features.join('\n'),
      url,
    };

    const filters = {};
    if (mcuFamily) {
      filters['mcu'] = [mcuFamily];
    }
    if (data.mounting) {
      filters['mounting'] = [String(data.mounting)];
    }
    if (uartsCount !== undefined) {
      filters['uarts'] = [bucketizeUarts(uartsCount)];
    }
    filters['can'] = [canCount > 0 ? '1' : '0'];
    filters['sd'] = [sdCard ? '1' : '0'];
    if (firmwareStatuses.length > 0) {
      filters['firmware'] = firmwareStatuses.map((status) => String(status));
    }
    filters['lifecycle'] = [lifecycle];

    const content = buildContent({
      title: meta.title,
      brandName,
      model: meta.model,
      keywordList,
      summary,
      features,
      notes,
    });

    await index.addCustomRecord({
      url,
      content,
      language: 'en',
      meta,
      filters,
    });

    records.push({
      id: data.id,
      slug: normalizedSlug,
      title: meta.title,
      brand: data.brand ?? '',
      brand_name: brandName,
      model: meta.model,
      mcu: data.mcu ?? '',
      mcu_name: mcuName ?? '',
      mcu_family: mcuFamily,
      mounting: data.mounting ?? '',
      uarts: uartsCount ?? null,
      can: canCount ?? 0,
      sd: sdCard,
      firmware_ids: firmwareIds,
      firmware_statuses: firmwareStatuses,
      lifecycle,
      summary,
      notes,
      keywords: keywordList,
      features,
      url,
      filters,
    });
  }

  await index.writeFiles({ outputPath: outputDir });
  await mkdir(outputDir, { recursive: true });
  await writeFile(
    path.join(outputDir, 'controllers.json'),
    JSON.stringify(records, null, 2),
    'utf8'
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const outputArgIndex = process.argv.indexOf('--output');
  const outputDir =
    outputArgIndex !== -1 ? process.argv[outputArgIndex + 1] : path.join(repoRoot, 'public', 'pagefind');

  buildControllerPagefindIndex({ outputDir })
    .then(() => {
      console.log(`Pagefind index written to ${outputDir}`);
    })
    .catch((error) => {
      console.error('Failed to build Pagefind index', error);
      process.exit(1);
    });
}

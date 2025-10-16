import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';
import yaml from 'yaml';
import Ajv, { type ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const schemaPath = path.join(repoRoot, 'meta', 'schema', 'controller.schema.json');
const controllersDir = path.join(repoRoot, 'src', 'content', 'controllers');

const manufacturersDir = path.join(repoRoot, 'src', 'content', 'manufacturers');
const mcuDir = path.join(repoRoot, 'src', 'content', 'mcu');
const sensorsDir = path.join(repoRoot, 'src', 'content', 'sensors');
const firmwareDir = path.join(repoRoot, 'src', 'content', 'firmware');
const sourcesDir = path.join(repoRoot, 'src', 'content', 'sources');
const controllerImagesDir = path.join(repoRoot, 'src', 'assets', 'images', 'controllers');

type ReferenceSets = {
  manufacturers: Set<string>;
  mcu: Set<string>;
  sensors: Set<string>;
  firmware: Set<string>;
  sources: Set<string>;
  images: Set<string>;
};

type IssuesMap = Map<string, string[]>;

const readJson = async <T>(filePath: string): Promise<T> => {
  const raw = await readFile(filePath, 'utf8');
  return JSON.parse(raw) as T;
};

const loadYaml = async (filePath: string) => {
  const raw = await readFile(filePath, 'utf8');
  return yaml.parse(raw);
};

const gatherIds = async (pattern: string): Promise<Set<string>> => {
  const files = await glob(pattern, { absolute: true });
  const ids = new Set<string>();

  for (const file of files) {
    const data = await loadYaml(file);
    const id = data?.id;
    if (typeof id !== 'string' || id.trim().length === 0) {
      throw new Error(`Missing id field in ${path.relative(repoRoot, file)}`);
    }
    ids.add(id.trim());
  }

  return ids;
};

const gatherImageNames = async (dir: string): Promise<Set<string>> => {
  const files = await glob(`${dir}/**/*`, { absolute: true, nodir: true });
  const names = new Set<string>();

  for (const file of files) {
    const relative = path.relative(dir, file).replace(/\\/g, '/');
    names.add(relative);
  }

  return names;
};

const formatInstancePath = (instancePath: string): string => {
  if (!instancePath) {
    return '(root)';
  }

  return instancePath
    .replace(/^\//, '')
    .split('/')
    .map((segment) => segment.replace(/~1/g, '/').replace(/~0/g, '~'))
    .join('.');
};

const formatAjvError = (error: ErrorObject): string => {
  const location = formatInstancePath(error.instancePath);
  const params = error.params as { missingProperty?: string; additionalProperty?: string };

  if (error.keyword === 'required' && params.missingProperty) {
    return `${location}: missing required property '${params.missingProperty}'`;
  }

  if (error.keyword === 'additionalProperties' && params.additionalProperty) {
    return `${location}: unexpected property '${params.additionalProperty}'`;
  }

  return `${location}: ${error.message ?? 'validation error'}`;
};

const addIssue = (issues: IssuesMap, file: string, message: string) => {
  const fileIssues = issues.get(file) ?? [];
  fileIssues.push(message);
  issues.set(file, fileIssues);
};

const validateReferences = (
  controller: any,
  issues: IssuesMap,
  file: string,
  refs: ReferenceSets
) => {
  const {
    brand,
    mcu,
    firmware_support: firmwareSupport,
    sensors,
    sources,
    hardware,
    known_issues,
    images,
  } =
    controller ?? {};

  if (typeof brand === 'string' && !refs.manufacturers.has(brand)) {
    addIssue(issues, file, `brand references unknown manufacturer '${brand}'`);
  }

  if (typeof mcu === 'string' && !refs.mcu.has(mcu)) {
    addIssue(issues, file, `mcu references unknown entry '${mcu}'`);
  }

  const checkSensorList = (list: any[] | undefined, context: string) => {
    if (!Array.isArray(list)) {
      return;
    }

    for (const entry of list) {
      const id = entry?.id;
      if (typeof id === 'string' && !refs.sensors.has(id)) {
        addIssue(issues, file, `${context} references unknown sensor '${id}'`);
      }
    }
  };

  if (sensors) {
    checkSensorList(sensors.imu, 'sensors.imu');
    checkSensorList(sensors.barometer, 'sensors.barometer');
    checkSensorList(sensors.magnetometer, 'sensors.magnetometer');
  }

  if (Array.isArray(firmwareSupport)) {
    for (const entry of firmwareSupport) {
      const id = entry?.id;
      if (typeof id === 'string' && !refs.firmware.has(id)) {
        addIssue(issues, file, `firmware_support references unknown firmware '${id}'`);
      }
    }
  }

  if (Array.isArray(sources)) {
    for (const sourceId of sources) {
      if (typeof sourceId === 'string' && !refs.sources.has(sourceId)) {
        addIssue(issues, file, `sources references unknown source '${sourceId}'`);
      }
    }
  }

  if (Array.isArray(images)) {
    for (let index = 0; index < images.length; index++) {
      const entry = images[index];
      const src = entry?.src;
      if (typeof src !== 'string' || src.trim().length === 0) {
        continue;
      }

      const normalized = src.trim().replace(/\\/g, '/');
      if (!refs.images.has(normalized)) {
        addIssue(
          issues,
          file,
          `images[${index}] references missing controller image '${normalized}'`
        );
      }
    }
  }

  if (Array.isArray(known_issues)) {
    for (const issue of known_issues) {
      const sourceId = issue?.source;
      if (typeof sourceId === 'string' && !refs.sources.has(sourceId)) {
        addIssue(issues, file, `known_issues entry references unknown source '${sourceId}'`);
      }
    }
  }

  const revisions = hardware?.revisions;
  if (Array.isArray(revisions)) {
    for (const revision of revisions) {
      if (Array.isArray(revision?.sources)) {
        for (const sourceId of revision.sources) {
          if (typeof sourceId === 'string' && !refs.sources.has(sourceId)) {
            addIssue(
              issues,
              file,
              `hardware.revisions['${revision?.id ?? 'unknown'}'] references unknown source '${sourceId}'`
            );
          }
        }
      }

      const overrideSensors = revision?.overrides?.sensors;
      if (overrideSensors) {
        checkSensorList(overrideSensors.imu, "hardware.revisions overrides imu");
        checkSensorList(overrideSensors.barometer, "hardware.revisions overrides barometer");
        checkSensorList(overrideSensors.magnetometer, "hardware.revisions overrides magnetometer");
      }
    }
  }
};

const main = async () => {
  const schema = await readJson<Record<string, unknown>>(schemaPath);
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);

  const validate = ajv.compile(schema);

  const [manufacturerIds, mcuIds, sensorIds, firmwareIds, sourceIds, imageNames] = await Promise.all([
    gatherIds(path.join(manufacturersDir, '*.yaml')),
    gatherIds(path.join(mcuDir, '*.yaml')),
    gatherIds(path.join(sensorsDir, '*.yaml')),
    gatherIds(path.join(firmwareDir, '*.yaml')),
    gatherIds(path.join(sourcesDir, '*.yaml')),
    gatherImageNames(controllerImagesDir),
  ]);

  const refs: ReferenceSets = {
    manufacturers: manufacturerIds,
    mcu: mcuIds,
    sensors: sensorIds,
    firmware: firmwareIds,
    sources: sourceIds,
    images: imageNames,
  };

  const controllerFiles = await glob(`${controllersDir}/**/*.yaml`, { absolute: true });
  const issues: IssuesMap = new Map();

  for (const file of controllerFiles) {
    const relativePath = path.relative(repoRoot, file);

    let data: any;
    try {
      data = await loadYaml(file);
    } catch (error) {
      addIssue(issues, relativePath, `failed to parse YAML: ${(error as Error).message}`);
      continue;
    }

    const valid = validate(data);
    if (!valid) {
      const errors = validate.errors ?? [];
      for (const error of errors) {
        addIssue(issues, relativePath, formatAjvError(error));
      }
    }

    validateReferences(data, issues, relativePath, refs);
  }

  if (issues.size > 0) {
    console.error('\nController validation failed.');
    const sortedFiles = Array.from(issues.keys()).sort();
    for (const file of sortedFiles) {
      console.error(`\n${file}`);
      const messages = issues.get(file) ?? [];
      for (const message of messages) {
        console.error(`  - ${message}`);
      }
    }
    console.error(`\n${issues.size} file(s) reported issues.`);
    process.exit(1);
  }

  console.log(`Validated ${controllerFiles.length} controller file(s) successfully.`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

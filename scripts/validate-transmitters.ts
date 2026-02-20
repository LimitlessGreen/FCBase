import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';
import yaml from 'yaml';
import Ajv, { type ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const schemaPath = path.join(repoRoot, 'meta', 'schema', 'transmitter.schema.json');
const transmittersDir = path.join(repoRoot, 'src', 'content', 'transmitters');
const manufacturersDir = path.join(repoRoot, 'src', 'content', 'manufacturers');
const sourcesDir = path.join(repoRoot, 'src', 'content', 'sources');
const transmitterImagesDir = path.join(repoRoot, 'src', 'assets', 'images', 'transmitters');

type IssuesMap = Map<string, string[]>;

const loadYaml = async (filePath: string) => {
  const raw = await readFile(filePath, 'utf8');
  return yaml.parse(raw);
};

const readJson = async <T>(filePath: string): Promise<T> => {
  const raw = await readFile(filePath, 'utf8');
  return JSON.parse(raw) as T;
};

const gatherIds = async (pattern: string): Promise<Set<string>> => {
  const files = await glob(pattern, { absolute: true });
  const ids = new Set<string>();

  for (const file of files) {
    const data = await loadYaml(file);
    const id = data?.id;
    if (typeof id === 'string' && id.trim().length > 0) {
      ids.add(id.trim());
    }
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

const addIssue = (issues: IssuesMap, file: string, message: string) => {
  const fileIssues = issues.get(file) ?? [];
  fileIssues.push(message);
  issues.set(file, fileIssues);
};

const VALID_SUPPORT_LEVELS = ['official', 'manufacturer', 'community'] as const;
const VALID_SUPPORT_STATUSES = ['supported', 'limited', 'sunset', 'planned'] as const;
const VALID_FORM_FACTORS = ['handheld', 'tray', 'gamepad'] as const;
const VALID_DISPLAY_TYPES = ['color', 'monochrome'] as const;
const VALID_VERIFICATION_LEVELS = ['unverified', 'community', 'reviewed'] as const;

const validateRequiredFields = (data: any, issues: IssuesMap, file: string) => {
  if (typeof data.id !== 'string' || data.id.trim().length === 0) {
    addIssue(issues, file, 'missing required field: id');
  }

  if (typeof data.title !== 'string' || data.title.trim().length === 0) {
    addIssue(issues, file, 'missing required field: title');
  }

  if (typeof data.brand !== 'string' || data.brand.trim().length === 0) {
    addIssue(issues, file, 'missing required field: brand');
  }

  // support object
  if (!data.support || typeof data.support !== 'object') {
    addIssue(issues, file, 'missing required field: support');
  } else {
    if (!VALID_SUPPORT_LEVELS.includes(data.support.level)) {
      addIssue(issues, file, `support.level must be one of: ${VALID_SUPPORT_LEVELS.join(', ')} (got '${data.support.level}')`);
    }
    if (typeof data.support.since_version !== 'string' || data.support.since_version.trim().length === 0) {
      addIssue(issues, file, 'missing required field: support.since_version');
    }
    if (!VALID_SUPPORT_STATUSES.includes(data.support.status)) {
      addIssue(issues, file, `support.status must be one of: ${VALID_SUPPORT_STATUSES.join(', ')} (got '${data.support.status}')`);
    }
  }

  // sources
  if (!Array.isArray(data.sources) || data.sources.length === 0) {
    addIssue(issues, file, 'missing required field: sources (must have at least 1 entry)');
  }

  // keywords
  if (!Array.isArray(data.keywords) || data.keywords.length === 0) {
    addIssue(issues, file, 'missing required field: keywords (must have at least 1 entry)');
  }

  // verification
  if (!data.verification || typeof data.verification !== 'object') {
    addIssue(issues, file, 'missing required field: verification');
  } else {
    if (!VALID_VERIFICATION_LEVELS.includes(data.verification.level)) {
      addIssue(issues, file, `verification.level must be one of: ${VALID_VERIFICATION_LEVELS.join(', ')} (got '${data.verification.level}')`);
    }
    if (typeof data.verification.last_updated !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data.verification.last_updated)) {
      addIssue(issues, file, 'verification.last_updated must be a date string in YYYY-MM-DD format');
    }
  }
};

const validateEnums = (data: any, issues: IssuesMap, file: string) => {
  if (data.hardware?.form_factor && !VALID_FORM_FACTORS.includes(data.hardware.form_factor)) {
    addIssue(issues, file, `hardware.form_factor must be one of: ${VALID_FORM_FACTORS.join(', ')} (got '${data.hardware.form_factor}')`);
  }

  if (data.hardware?.display && !VALID_DISPLAY_TYPES.includes(data.hardware.display)) {
    addIssue(issues, file, `hardware.display must be one of: ${VALID_DISPLAY_TYPES.join(', ')} (got '${data.hardware.display}')`);
  }
};

const validateReferences = (
  data: any,
  issues: IssuesMap,
  file: string,
  refs: { manufacturers: Set<string>; sources: Set<string>; images: Set<string> }
) => {
  if (typeof data.brand === 'string' && !refs.manufacturers.has(data.brand)) {
    addIssue(issues, file, `brand references unknown manufacturer '${data.brand}'`);
  }

  if (Array.isArray(data.sources)) {
    for (const sourceId of data.sources) {
      if (typeof sourceId === 'string' && !refs.sources.has(sourceId)) {
        addIssue(issues, file, `sources references unknown source '${sourceId}'`);
      }
    }
  }

  // Check revision sources
  const revisions = data.hardware?.revisions;
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
    }
  }

  // Check images
  if (Array.isArray(data.images)) {
    for (let index = 0; index < data.images.length; index++) {
      const entry = data.images[index];
      const src = entry?.src;
      if (typeof src !== 'string' || src.trim().length === 0) {
        continue;
      }

      const normalized = src.trim().replace(/\\/g, '/');
      // Skip absolute URLs (external images)
      if (/^https?:\/\//.test(normalized)) {
        continue;
      }
      if (!refs.images.has(normalized)) {
        addIssue(issues, file, `images[${index}] references missing transmitter image '${normalized}'`);
      }
    }
  }
};

const validateIdConsistency = (data: any, issues: IssuesMap, file: string) => {
  const basename = path.basename(file, '.yaml');
  if (typeof data.id === 'string' && data.id !== basename) {
    addIssue(issues, file, `id '${data.id}' does not match filename '${basename}'`);
  }
};

const formatInstancePath = (instancePath: string): string => {
  if (!instancePath) return '(root)';
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

const main = async () => {
  const schema = await readJson<Record<string, unknown>>(schemaPath);
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);

  const [manufacturerIds, sourceIds, imageNames] = await Promise.all([
    gatherIds(path.join(manufacturersDir, '*.yaml')),
    gatherIds(path.join(sourcesDir, '**', '*.yaml')),
    gatherImageNames(transmitterImagesDir),
  ]);

  const refs = {
    manufacturers: manufacturerIds,
    sources: sourceIds,
    images: imageNames,
  };

  const transmitterFiles = await glob(`${transmittersDir}/**/*.yaml`, { absolute: true });
  const issues: IssuesMap = new Map();

  for (const file of transmitterFiles) {
    const relativePath = path.relative(repoRoot, file);

    let data: any;
    try {
      data = await loadYaml(file);
    } catch (error) {
      addIssue(issues, relativePath, `failed to parse YAML: ${(error as Error).message}`);
      continue;
    }

    validateRequiredFields(data, issues, relativePath);
    validateEnums(data, issues, relativePath);
    validateReferences(data, issues, relativePath, refs);
    validateIdConsistency(data, issues, relativePath);

    const valid = validate(data);
    if (!valid) {
      const errors = validate.errors ?? [];
      for (const error of errors) {
        addIssue(issues, relativePath, `schema: ${formatAjvError(error)}`);
      }
    }
  }

  if (issues.size > 0) {
    console.error('\nTransmitter validation failed.');
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

  console.log(`Validated ${transmitterFiles.length} transmitter file(s) successfully.`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

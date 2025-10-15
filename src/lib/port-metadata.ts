export type PortTypeKey =
  | 'uart'
  | 'i2c'
  | 'can'
  | 'power'
  | 'usb'
  | 'ethernet'
  | 'pwm'
  | 'spi'
  | 'rc'
  | 'gps'
  | 'analog'
  | 'debug'
  | 'video'
  | 'led'
  | 'buzzer'
  | 'storage'
  | 'other';

export type PortTypeMeta = {
  icon: string;
  badgeClassName: string;
  ringClassName: string;
  connectorColor: string;
};

const PORT_TYPE_META: Record<PortTypeKey, PortTypeMeta> = {
  uart: {
    icon: '🔵',
    badgeClassName:
      'border border-sky-500/30 bg-sky-500/10 text-sky-700 dark:border-sky-400/30 dark:text-sky-300',
    ringClassName: 'ring-sky-500/35 dark:ring-sky-400/30',
    connectorColor: 'rgba(56, 189, 248, 0.65)',
  },
  i2c: {
    icon: '🟢',
    badgeClassName:
      'border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:text-emerald-300',
    ringClassName: 'ring-emerald-500/30 dark:ring-emerald-400/35',
    connectorColor: 'rgba(16, 185, 129, 0.6)',
  },
  can: {
    icon: '🟣',
    badgeClassName:
      'border border-purple-500/30 bg-purple-500/10 text-purple-700 dark:border-purple-400/30 dark:text-purple-300',
    ringClassName: 'ring-purple-500/35 dark:ring-purple-400/35',
    connectorColor: 'rgba(147, 51, 234, 0.6)',
  },
  power: {
    icon: '🟠',
    badgeClassName:
      'border border-orange-500/30 bg-orange-500/10 text-orange-700 dark:border-orange-400/30 dark:text-orange-300',
    ringClassName: 'ring-orange-500/35 dark:ring-orange-400/35',
    connectorColor: 'rgba(249, 115, 22, 0.6)',
  },
  usb: {
    icon: '⚪',
    badgeClassName:
      'border border-zinc-500/30 bg-zinc-500/10 text-zinc-700 dark:border-zinc-400/30 dark:text-zinc-300',
    ringClassName: 'ring-zinc-500/30 dark:ring-zinc-400/30',
    connectorColor: 'rgba(113, 113, 122, 0.55)',
  },
  ethernet: {
    icon: '🌐',
    badgeClassName:
      'border border-blue-500/30 bg-blue-500/10 text-blue-700 dark:border-blue-400/30 dark:text-blue-300',
    ringClassName: 'ring-blue-500/30 dark:ring-blue-400/30',
    connectorColor: 'rgba(59, 130, 246, 0.6)',
  },
  pwm: {
    icon: '🎛️',
    badgeClassName:
      'border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:border-amber-400/30 dark:text-amber-300',
    ringClassName: 'ring-amber-500/35 dark:ring-amber-400/35',
    connectorColor: 'rgba(245, 158, 11, 0.6)',
  },
  spi: {
    icon: '🧿',
    badgeClassName:
      'border border-pink-500/30 bg-pink-500/10 text-pink-700 dark:border-pink-400/30 dark:text-pink-300',
    ringClassName: 'ring-pink-500/35 dark:ring-pink-400/35',
    connectorColor: 'rgba(236, 72, 153, 0.6)',
  },
  rc: {
    icon: '🎮',
    badgeClassName:
      'border border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:border-indigo-400/30 dark:text-indigo-300',
    ringClassName: 'ring-indigo-500/35 dark:ring-indigo-400/35',
    connectorColor: 'rgba(99, 102, 241, 0.6)',
  },
  gps: {
    icon: '🧭',
    badgeClassName:
      'border border-sky-500/30 bg-sky-500/10 text-sky-700 dark:border-sky-400/30 dark:text-sky-300',
    ringClassName: 'ring-sky-500/30 dark:ring-sky-400/30',
    connectorColor: 'rgba(56, 189, 248, 0.6)',
  },
  analog: {
    icon: '📈',
    badgeClassName:
      'border border-lime-500/30 bg-lime-500/10 text-lime-700 dark:border-lime-400/30 dark:text-lime-300',
    ringClassName: 'ring-lime-500/30 dark:ring-lime-400/35',
    connectorColor: 'rgba(132, 204, 22, 0.6)',
  },
  debug: {
    icon: '🛠️',
    badgeClassName:
      'border border-slate-500/30 bg-slate-500/10 text-slate-700 dark:border-slate-400/30 dark:text-slate-300',
    ringClassName: 'ring-slate-500/30 dark:ring-slate-400/30',
    connectorColor: 'rgba(100, 116, 139, 0.55)',
  },
  video: {
    icon: '📹',
    badgeClassName:
      'border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:border-rose-400/30 dark:text-rose-300',
    ringClassName: 'ring-rose-500/30 dark:ring-rose-400/35',
    connectorColor: 'rgba(244, 63, 94, 0.6)',
  },
  led: {
    icon: '💡',
    badgeClassName:
      'border border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-700 dark:border-fuchsia-400/30 dark:text-fuchsia-300',
    ringClassName: 'ring-fuchsia-500/30 dark:ring-fuchsia-400/35',
    connectorColor: 'rgba(217, 70, 239, 0.6)',
  },
  buzzer: {
    icon: '🔔',
    badgeClassName:
      'border border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:border-yellow-400/30 dark:text-yellow-300',
    ringClassName: 'ring-yellow-500/30 dark:ring-yellow-400/35',
    connectorColor: 'rgba(234, 179, 8, 0.6)',
  },
  storage: {
    icon: '💾',
    badgeClassName:
      'border border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:border-cyan-400/30 dark:text-cyan-300',
    ringClassName: 'ring-cyan-500/35 dark:ring-cyan-400/35',
    connectorColor: 'rgba(6, 182, 212, 0.6)',
  },
  other: {
    icon: '⚙️',
    badgeClassName:
      'border border-black/10 bg-muted/50 text-muted-foreground dark:border-white/10 dark:text-foreground',
    ringClassName: 'ring-muted/40 dark:ring-muted/40',
    connectorColor: 'rgba(148, 163, 184, 0.55)',
  },
};

const normalizePortType = (type?: string): PortTypeKey => {
  if (!type) return 'other';
  const normalized = type.toLowerCase() as PortTypeKey;
  if (normalized in PORT_TYPE_META) {
    return normalized;
  }
  return 'other';
};

export const getPortTypeMeta = (type?: string): PortTypeMeta => {
  const key = normalizePortType(type);
  return PORT_TYPE_META[key];
};

export const getAllPortTypeMeta = () => PORT_TYPE_META;

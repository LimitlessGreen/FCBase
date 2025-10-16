import type { CollectionEntry } from "astro:content";
import type { ImageMetadata } from "astro";

import { resolveControllerPreviewImage } from "@/lib/controller-images";
import { getManufacturersMap } from "@/lib/content-cache";

type ManufacturerEntry = CollectionEntry<"manufacturers">;

type ManufacturerMap = Map<string, ManufacturerEntry>;

export interface ControllerCardImage {
  src: ImageMetadata | string;
  alt?: string;
  credit?: string;
  sourceUrl?: string;
  width?: number;
  height?: number;
}

export interface ControllerCardModel {
  id: string;
  title: string;
  manufacturer?: string;
  mcu: string;
  mounting?: string;
  uarts?: number;
  can?: number;
  pwm?: number;
  sdCard: boolean;
  barometer: boolean;
  ethernet: boolean;
  firmwares: string[];
  image?: ControllerCardImage;
  variant: 'grid' | 'compact';
}

interface BuildOptions {
  manufacturersMap?: ManufacturerMap;
}

const resolveManufacturerName = (
  controller: CollectionEntry<"controllers">,
  manufacturers: ManufacturerMap
): string | undefined => {
  if (!controller.data.brand) {
    return undefined;
  }

  const entry = manufacturers.get(controller.data.brand);
  if (!entry) {
    return controller.data.brand;
  }

  return entry.data.name ?? entry.data.title ?? controller.data.brand;
};

const normalizeImage = (
  controller: CollectionEntry<"controllers">
): ControllerCardImage | undefined => {
  const preview = resolveControllerPreviewImage(controller);
  if (!preview) {
    return undefined;
  }

  const { src, alt, credit, sourceUrl, width, height } = preview;
  return { src, alt, credit, sourceUrl, width, height };
};

const hasBarometer = (controller: CollectionEntry<"controllers">): boolean => {
  const barometers = controller.data.sensors?.barometer;
  if (!barometers || barometers.length === 0) {
    return false;
  }

  return barometers.some((item) => ("count" in item ? item.count ?? 0 : 1) > 0);
};

const resolveFirmwareIds = (controller: CollectionEntry<"controllers">): string[] =>
  (controller.data.firmware_support ?? [])
    .map((entry) => entry.id)
    .filter((id): id is string => Boolean(id))
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

export async function createControllerCardModel(
  controller: CollectionEntry<"controllers">,
  options: BuildOptions = {}
): Promise<ControllerCardModel> {
  const manufacturers =
    options.manufacturersMap ?? (await getManufacturersMap());

  return {
    id: controller.id,
    title: controller.data.title,
    manufacturer: resolveManufacturerName(controller, manufacturers),
    mcu: controller.data.mcu ?? "unknown",
    mounting: controller.data.mounting,
    uarts: controller.data.io?.uarts,
    can: controller.data.io?.can,
    pwm: controller.data.io?.pwm,
    sdCard: Boolean(controller.data.io?.sd_card),
    barometer: hasBarometer(controller),
    ethernet: Boolean(controller.data.io?.ethernet),
    firmwares: resolveFirmwareIds(controller),
    image: normalizeImage(controller),
    variant: 'grid',
  };
}

export async function createControllerCardModels(
  controllers: Array<CollectionEntry<"controllers">>,
  options: BuildOptions = {}
): Promise<ControllerCardModel[]> {
  if (controllers.length === 0) {
    return [];
  }

  const manufacturers =
    options.manufacturersMap ?? (await getManufacturersMap());

  return Promise.all(
    controllers.map((controller) =>
      createControllerCardModel(controller, { manufacturersMap: manufacturers })
    )
  );
}

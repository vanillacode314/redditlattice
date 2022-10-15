import sharp, { AvailableFormatInfo, FormatEnum, Sharp } from "sharp";
/* import PQueue from "p-queue"; */
/**/
/* const queueSize = 5; */
/* const queue = new PQueue({ concurrency: queueSize }); */

type ImageFormat = keyof FormatEnum | AvailableFormatInfo;

export function getTransformer(
  width: number = 300,
  format: ImageFormat
): Sharp {
  let transformer = sharp({ failOn: "none" }).toFormat(format);
  if (width > 0) {
    transformer = transformer.resize({ width });
  }
  return transformer;
}

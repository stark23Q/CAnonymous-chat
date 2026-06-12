import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";
import { env } from "../config/env.js";

function storageConfigured() {
  return Boolean(env.S3_BUCKET && env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY);
}

export function assertStorageConfigured() {
  if (!storageConfigured()) {
    throw new Error("S3-compatible storage is not configured.");
  }
}

function createS3Client() {
  assertStorageConfigured();

  return new S3Client({
    region: env.S3_REGION,
    forcePathStyle: env.S3_FORCE_PATH_STYLE,
    ...(env.S3_ENDPOINT ? { endpoint: env.S3_ENDPOINT } : {}),
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID as string,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY as string
    }
  });
}

export async function createPresignedUpload(input: {
  groupId: string;
  filename: string;
  contentType: string;
  size: number;
}) {
  const extension = path.extname(input.filename).slice(0, 12).replace(/[^a-z0-9.]/gi, "");
  const objectKey = `groups/${input.groupId}/${new Date().toISOString().slice(0, 10)}/${nanoid(24)}${extension}`;
  const s3 = createS3Client();

  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: objectKey,
    ContentType: input.contentType,
    ContentLength: input.size
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 * 5 });
  const publicUrl = env.S3_PUBLIC_BASE_URL
    ? `${env.S3_PUBLIC_BASE_URL.replace(/\/$/, "")}/${objectKey}`
    : null;

  return {
    objectKey,
    uploadUrl,
    publicUrl,
    expiresInSeconds: 300
  };
}

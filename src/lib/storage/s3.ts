import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { localDelete, localUpload, useLocalStorage } from "@/lib/storage/local";
import { signLocalDownloadParams } from "@/lib/storage/signed-local";
import { absoluteUrl } from "@/lib/utils";

function s3Config() {
  return {
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
    },
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "false",
  };
}

export function getS3() {
  return new S3Client(s3Config());
}

export function getBucket() {
  return process.env.S3_BUCKET || "techplatform-files";
}

export async function ensureBucket() {
  if (useLocalStorage()) return;
  const client = getS3();
  const bucket = getBucket();
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch {
    await client.send(new CreateBucketCommand({ Bucket: bucket }));
  }
}

export async function uploadObject(params: {
  key: string;
  body: Buffer;
  contentType: string;
}) {
  if (useLocalStorage()) {
    await localUpload({ key: params.key, body: params.body });
    return { bucket: "local", key: params.key };
  }
  const client = getS3();
  await ensureBucket();
  await client.send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
    }),
  );
  return { bucket: getBucket(), key: params.key };
}

export async function deleteObject(key: string, bucket = getBucket()) {
  if (bucket === "local" || useLocalStorage()) {
    await localDelete(key);
    return;
  }
  const client = getS3();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export async function getPresignedDownloadUrl(key: string, expiresIn = 120, filename?: string) {
  if (useLocalStorage()) {
    const exp = Date.now() + expiresIn * 1000;
    const sig = signLocalDownloadParams({ key, exp, filename });
    const qs = new URLSearchParams({
      key,
      exp: String(exp),
      sig,
    });
    if (filename) qs.set("filename", filename);
    return absoluteUrl(`/api/v1/downloads/local?${qs.toString()}`);
  }
  const client = getS3();
  const command = new GetObjectCommand({
    Bucket: getBucket(),
    Key: key,
    ResponseContentDisposition: filename
      ? `attachment; filename="${filename.replace(/"/g, "")}"`
      : undefined,
  });
  return getSignedUrl(client, command, { expiresIn });
}

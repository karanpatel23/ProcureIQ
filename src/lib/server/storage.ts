import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { createId } from './db';
import { env, uploadPolicy } from './env';
import { ApiError } from './api';

export async function storeQuoteSource(input: { workspaceId: string; file?: File; pastedText?: string }) {
  if (input.file) {
    if (input.file.size > uploadPolicy.maxBytes) throw new ApiError(400, 'FILE_TOO_LARGE', 'Quote file is larger than the allowed upload size.');
    if (!uploadPolicy.allowedMimeTypes.includes(input.file.type)) throw new ApiError(400, 'FILE_TYPE_NOT_ALLOWED', 'Upload a PDF, spreadsheet, image, or text quote file.');
    const key = `${input.workspaceId}/${createId('qdoc')}-${input.file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const path = join(env.QUOTE_STORAGE_PATH, key);
    await fs.mkdir(join(env.QUOTE_STORAGE_PATH, input.workspaceId), { recursive: true });
    await fs.writeFile(path, Buffer.from(await input.file.arrayBuffer()));
    // Only text files yield real extractable content. For PDFs/images/sheets we
    // store the attachment and say so honestly — pretending to extract from a
    // placeholder string produces confidently wrong numbers downstream.
    const textExtracted = input.file.type.startsWith('text/');
    const text = textExtracted ? await input.file.text() : `Uploaded file: ${input.file.name}`;
    return { storageKey: key, fileName: input.file.name, mimeType: input.file.type, byteSize: input.file.size, sourceText: text, textExtracted };
  }
  const text = input.pastedText?.trim();
  if (!text) throw new ApiError(400, 'SOURCE_REQUIRED', 'Upload a quote file or paste supplier quote text.');
  const key = `${input.workspaceId}/${createId('qtxt')}.txt`;
  const path = join(env.QUOTE_STORAGE_PATH, key);
  await fs.mkdir(join(env.QUOTE_STORAGE_PATH, input.workspaceId), { recursive: true });
  await fs.writeFile(path, text);
  return { storageKey: key, fileName: 'pasted-supplier-quote.txt', mimeType: 'text/plain', byteSize: Buffer.byteLength(text), sourceText: text, textExtracted: true };
}

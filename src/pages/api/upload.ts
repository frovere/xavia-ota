import { UTCDate } from '@date-fns/utc';
import AdmZip from 'adm-zip';
import { format } from 'date-fns';
import formidable from 'formidable';
import fs from 'fs';
import { NextApiRequest, NextApiResponse } from 'next';

import { DatabaseFactory } from '@/api-utils/database/database-factory';
import { HashHelper } from '@/api-utils/helpers/hash-helper';
import { ZipHelper } from '@/api-utils/helpers/zip-helper';
import { getLogger } from '@/api-utils/logger';
import { StorageFactory } from '@/api-utils/storage/storage-factory';

const logger = getLogger('upload');

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function uploadHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const bearerHeader = req.headers.authorization;
  if (bearerHeader && bearerHeader !== `Bearer ${process.env.UPLOAD_KEY}`) {
    res.status(401).json({ error: 'Unauthorized: wrong upload key' });
    return;
  }

  const form = formidable({});

  try {
    const [fields, files] = await form.parse(req);
    const uploadKey = fields.uploadKey?.[0] || null;

    if (!bearerHeader && uploadKey !== process.env.UPLOAD_KEY) {
      res.status(401).json({ error: 'Unauthorized: wrong upload key' });
      return;
    }

    const file = files.file?.[0];
    const runtimeVersion = fields.runtimeVersion?.[0];
    const commitHash = fields.commitHash?.[0];
    const commitMessage = fields.commitMessage?.[0] || 'No message provided';

    if (!file || !runtimeVersion || !commitHash) {
      res.status(400).json({ error: 'Missing file, runtime version, or commit hash' });
      return;
    }

    const storage = StorageFactory.getStorage();
    const now = new UTCDate();
    const timestamp = format(now, 'yyyyMMddHHmmss');
    const updatePath = `updates/${runtimeVersion}`;

    // Store the zipped file as is
    const zipContent = fs.readFileSync(file.filepath);
    const zipFolder = new AdmZip(file.filepath);
    const metadataJsonFile = await ZipHelper.getFileFromZip(zipFolder, 'metadata.json');

    const updateHash = HashHelper.createHash(metadataJsonFile, 'sha256', 'hex');
    const updateId = HashHelper.convertSHA256HashToUUID(updateHash);

    const path = await storage.uploadFile(`${updatePath}/${timestamp}.zip`, zipContent);

    await DatabaseFactory.getDatabase().createRelease({
      path,
      runtimeVersion,
      timestamp: now.toISOString(),
      commitHash,
      commitMessage,
      updateId,
    });

    res.status(200).json({ success: true, path });
  } catch (error) {
    logger.error({ error }, 'Upload error.');
    res.status(500).json({ error: 'Upload failed' });
  }
}

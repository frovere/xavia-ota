import formidable from 'formidable';
import fs from 'fs';
import { format } from 'date-fns';
import { UTCDate } from '@date-fns/utc';
import { NextApiRequest, NextApiResponse } from 'next';
import AdmZip from 'adm-zip';

import { DatabaseFactory } from '@/api-utils/database/database-factory';
import { StorageFactory } from '@/api-utils/storage/storage-factory';
import { ZipHelper } from '@/api-utils/helpers/zip-helper';
import { HashHelper } from '@/api-utils/helpers/hash-helper';

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

  const form = formidable({});

  try {
    const [fields, files] = await form.parse(req);
    const uploadKey = fields.uploadKey?.[0] || null;
    const file = files.file?.[0];
    const runtimeVersion = fields.runtimeVersion?.[0];
    const commitHash = fields.commitHash?.[0];
    const commitMessage = fields.commitMessage?.[0] || 'No message provided';

    if (!uploadKey || !file || !runtimeVersion || !commitHash) {
      res.status(400).json({ error: 'Missing upload key, file, runtime version or commit hash' });
      return;
    }

    if (process.env.UPLOAD_KEY !== uploadKey) {
      res.status(400).json({ error: 'Upload failed: wrong upload key' });
      return;
    }

    const storage = StorageFactory.getStorage();
    const timestamp = format(new UTCDate(), 'yyyyMMddHHmmss');
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
      timestamp: new UTCDate().toISOString(),
      commitHash,
      commitMessage,
      updateId,
    });

    res.status(200).json({ success: true, path });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
}

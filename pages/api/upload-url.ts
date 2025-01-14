import S3 from 'aws-sdk/clients/s3';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const s3 = new S3({
    apiVersion: '2006-03-01',
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env?.AWS_ACCESS_KEY_ID + '',
      secretAccessKey: process.env?.AWS_SECRET_ACCESS_KEY + ''
    }
  });

  const post = await s3.createPresignedPost({
    Bucket: process.env.BUCKET_NAME,
    Fields: {
      key: req.query.key,
      'Content-Type': req.query.fileType
    },
    Expires: 60, // seconds
    Conditions: [
      ['content-length-range', 0, 10485760] // up to 1 MB
    ]
  });

  res.status(200).json(post);
}

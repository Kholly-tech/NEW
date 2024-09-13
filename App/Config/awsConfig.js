// const AWS = require('aws-sdk');

// AWS.config.update({
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//     region: process.env.AWS_BUCKET_REGION,
// });

// const s3 = new AWS.S3();

const { S3Client } = require("@aws-sdk/client-s3");

exports.s3Client = new S3Client({
  region: "eu-central-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// export { s3Client };

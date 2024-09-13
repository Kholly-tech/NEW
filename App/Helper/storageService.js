const fs = require("fs").promises;
const { s3Client } = require("../Config/awsConfig");
const {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_BUCKET_REGION;
// Upload a file

async function uploadFile(file, key) {
  try {
    // Read the file content asynchronously
    const fileContent = await fs.readFile(file.tempFilePath);

    // Determine the resource type based on the file's MIME type
    let resourceType;
    if (file.mimetype.startsWith("video/")) {
      resourceType = "video";
    } else if (file.mimetype.startsWith("image/")) {
      resourceType = "image";
    } else if (file.mimetype.startsWith("file/")) {
      resourceType = "file";
    } else if (file.mimetype.startsWith("application/")) {
      resourceType = "raw";
    } else if (file.mimetype.startsWith("audio/")) {
      resourceType = "audio";
    } else {
      resourceType = "unknown"; // Default case if MIME type doesn't match known types
    }

    // Metadata object including the resource type
    const metadata = {
      resource_type: resourceType,
    };

    // Prepare the parameters for the S3 upload
    const postParams = {
      Bucket: bucketName,
      Key: key,
      Body: fileContent,
      ContentType: file.mimetype,
      Metadata: metadata,
    };

    // Create a command to upload the file
    const command = new PutObjectCommand(postParams);

    // Send the command to S3
    const data = await s3Client.send(command);

    // Construct a custom URL for the uploaded file
    const myCustomUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;

    // Return the uploaded file data along with the custom URL
    return { ...data, myCustomUrl };
  } catch (err) {
    console.error("Error uploading file", err);
    throw err;
  }
}

// Download a file
async function downloadFile(key) {
  try {
    // Get presigned URL for files
    const getParams = {
      Bucket: bucketName,
      Key: key,
    };
    const newCommand = new GetObjectCommand(getParams);
    const presignedUrl = await getSignedUrl(s3Client, newCommand, {
      expiresIn: 3600,
    });
    return presignedUrl;
  } catch (err) {
    console.error("Error downloading file", err);
    throw err;
  }
}

// List files
function listFiles() {
  const params = {
    Bucket: bucketName,
  };

  return s3.listObjects(params).promise();
}

// Delete a file
async function deleteFile(key) {
  const deleteParams = {
    Bucket: bucketName,
    Key: key,
  };

  const command = new DeleteObjectCommand(deleteParams);
  return await s3Client.send(command);
}

module.exports = {
  uploadFile,
  downloadFile,
  listFiles,
  deleteFile,
};

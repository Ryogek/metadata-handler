const { S3Client } = require("@aws-sdk/client-s3");
require('dotenv').config();

/*declaring env path for S3 purposes*/
let endpointUrl = process.env.S3_ENDPOINT_URL;
let region = process.env.S3_REGION;
let accessKey = process.env.S3_ACCESS_KEY;
let secretKey = process.env.S3_SECRET_KEY;

const s3Client = new S3Client({
    endpoint: endpointUrl,
    region: region,
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey
    }
});

module.exports = {s3Client};
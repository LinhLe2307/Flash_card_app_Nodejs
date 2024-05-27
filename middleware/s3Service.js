const {S3} = require('aws-sdk');
const uuid = require('uuid').v4;

const s3 = new S3();
exports.uploadS3 = async(image) => {
    const { createReadStream, filename, mimetype } = await image;
      const stream = createReadStream();
      
      const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `uploads/${uuid()}-${filename}`,
        Body: stream,
        ContentType: mimetype,
        Metadata: {
          'Content-Disposition': 'inline' // Set the Content-Disposition header to 'inline'
        }
      };
      
      return await s3.upload(uploadParams).promise();
}

exports.deleteS3 = async(filePath) => {
    // Match the part of the URL after the word "upload" using regex
    const uploadPath = filePath.match(/upload.*/)[0];
    const param = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: uploadPath,
    }
    return await s3.deleteObject(param).promise();
}

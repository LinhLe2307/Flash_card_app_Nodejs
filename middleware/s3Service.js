const {S3} = require('aws-sdk');
const uuid = require('uuid').v4;

const s3 = new S3();
const uploadS3 = async(file) => {
    const param = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `uploads/${uuid()}-${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
            'Content-Disposition': 'inline' // Set the Content-Disposition header to 'inline'
        }
    }
    return await s3.upload(param).promise();
}

exports.s3Uploadv2 = async(req, res, next) => {
    try {
        const file = req.file;
        const result = await uploadS3(file);
        req.imagePath = result.Location;
        next();
    } catch (err) {
        next(err);
    }
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

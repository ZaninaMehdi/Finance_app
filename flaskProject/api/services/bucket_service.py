from config import CompanyConfig, get_aws_clients, logger
import os
class BucketService:

    def __init__(self, company_name: str):
        self.config = CompanyConfig(company_name)
        self.aws = self.config.aws
        self.bucket_name = self.config.bucket_name
        self.region = self.config.aws.region
        self.kb_key = self.config.kb_key
    
    def create_bucket(self):
        try:
            response = self.aws.s3.create_bucket(
                Bucket=self.bucket_name,
                CreateBucketConfiguration={
                    'LocationConstraint': self.region
                }
            )
            logger.info(f"Bucket {self.bucket_name} created successfully")
        except Exception as e:
            logger.error(f"Error creating bucket {self.bucket_name}: {str(e)}")
            raise e
        
    def bucket_exists(self):
        try:
            self.aws.s3.head_bucket(Bucket=self.bucket_name)
            return True
        except:
            return False

    def uploadDataSet(self, kb_files_path):
        for f in os.listdir(kb_files_path):
            file_path = kb_files_path + '/' + f
            s3_key = self.kb_key + '/' + f

            try:
                self.aws.s3.head_object(Bucket=self.bucket_name, Key=s3_key)
                logger.info(f"File {f} already exists in S3 bucket")
            except:
                try:
                    self.aws.s3.upload_file(file_path, self.bucket_name, s3_key)
                    logger.info(f"File {f} uploaded to S3 bucket")
                except Exception as e:
                    logger.error(f"Error uploading file {f} to S3 bucket: {str(e)}")
                    raise e
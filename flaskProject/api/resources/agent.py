from flask_restful import Resource
from api.services.orchestrator_service import ServiceOrchestrator
import os
from flask import request
from http import HTTPStatus
from config import logger


class AgentResource(Resource):
    def __init__(self):
        # Set up file upload configuration
        self.UPLOAD_FOLDER = '/tmp/pdf_uploads'  # Temporary storage
        self.ALLOWED_EXTENSIONS = {'pdf'}
        logger.info('Initialized AgentResource')
        # Create upload folder if it doesn't exist
        if not os.path.exists(self.UPLOAD_FOLDER):
            os.makedirs(self.UPLOAD_FOLDER)

    def allowed_file(self, filename):
        """Check if the file type is allowed based on its extension."""
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in self.ALLOWED_EXTENSIONS

    def post(self):
        try:
            # Check if the 'file' part is in the request
            if 'file' not in request.files:
                logger.error('No file part in the request')
                return {
                    'status': 'error',
                    'message': 'No file uploaded'
                }, HTTPStatus.BAD_REQUEST

            file = request.files['file']

            # Check if the filename is empty (user did not select a file)
            if file.filename == '':
                logger.error('No file selected for uploading')
                return {
                    'status': 'error',
                    'message': 'No file selected'
                }, HTTPStatus.BAD_REQUEST

            # Validate the file type
            if not self.allowed_file(file.filename):
                logger.error('Invalid file type uploaded')
                return {
                    'status': 'error',
                    'message': 'Invalid file type. Only PDF files are allowed.'
                }, HTTPStatus.BAD_REQUEST

            # Save the file to the designated upload folder
            file_path = os.path.join(self.UPLOAD_FOLDER, file.filename)
            file.save(file_path)
            logger.info(f'File {file.filename} uploaded successfully to {file_path}')

            orchestrator = ServiceOrchestrator("cn")
            response = orchestrator.initialize("/tmp/pdf_uploads")

            return {
                'status': 'success',
                'message': f'File {file.filename} uploaded successfully.',
                'response': response
            }, HTTPStatus.OK

        except Exception as e:
            logger.exception('An error occurred during file upload')
            return {
                'status': 'error',
                'message': f'An error occurred: {str(e)}'
            }, HTTPStatus.INTERNAL_SERVER_ERROR
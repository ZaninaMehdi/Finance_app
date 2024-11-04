
from flask_restful import Resource, reqparse
from werkzeug.datastructures import FileStorage
from flask import request, current_app
import os
from datetime import datetime
import boto3
from botocore.exceptions import ClientError
import json
import PyPDF2
from typing import Dict, List
from io import BytesIO
import time
from http import HTTPStatus
from werkzeug.utils import secure_filename
from tqdm import tqdm  # Import tqdm

class ReportSummarizerResource(Resource):
    def __init__(self):
        self.chunk_size = 12000  # Approximate characters per chunk
        self.overlap = 1000  # Overlap between chunks to maintain context
        self.bedrock = boto3.client(
            service_name='bedrock-runtime',
            region_name='us-west-2'
        )
        
        # Set up file upload configuration
        self.UPLOAD_FOLDER = '/tmp/pdf_uploads'  # Temporary storage
        self.ALLOWED_EXTENSIONS = {'pdf'}
        print('Initialized ReportSummarizerResource')
        
        # Create upload folder if it doesn't exist
        if not os.path.exists(self.UPLOAD_FOLDER):
            os.makedirs(self.UPLOAD_FOLDER)

    def allowed_file(self, filename):
        return '.' in filename and                filename.rsplit('.', 1)[1].lower() in self.ALLOWED_EXTENSIONS

    def extract_text_from_pdf(self, pdf_file) -> str:
        """Extract text from uploaded PDF file using PyPDF2 with tqdm for progress tracking"""
        try:
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            text = ""
            print("Extracting text from PDF...")
            for page in tqdm(pdf_reader.pages, desc="Reading PDF pages", unit="page"):
                text += page.extract_text() + "\n"
            return text
        except Exception as e:
            raise Exception(f"Error extracting text from PDF: {str(e)}")

    def create_chunks(self, text: str) -> List[str]:
        """Create overlapping chunks of text"""
        chunks = []
        start = 0
        text_length = len(text)
        print("Creating text chunks...")
        
        while start < text_length:
            end = start + self.chunk_size
            # Adjust end to complete last word
            if end < text_length:
                end = text.rfind('.', end - 100, end + 100)
                if end == -1:  # If no period found, try space
                    end = text.rfind(' ', end - 50, end + 50)
                if end == -1:  # If still no good break point, use chunk_size
                    end = start + self.chunk_size

            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            
            # Move start position considering overlap
            start = end - self.overlap
        
        print(f"Created {len(chunks)} chunks.")
        return chunks

    def claude_invoke(self, prompt: str, max_tokens: int = 500) -> str:
        """Invoke Claude model through Bedrock with retry logic"""
        max_retries = 3
        for attempt in range(max_retries):
            try:
                body = json.dumps({
                    "prompt": f"\n\nHuman: {prompt}\n\nAssistant:",
                    "max_tokens_to_sample": max_tokens,
                    "temperature": 0,
                    "top_p": 1,
                    "anthropic_version": "bedrock-2023-05-31"
                })
                
                response = self.bedrock.invoke_model(
                    modelId="anthropic.claude-instant-v1",  # Using faster model
                    body=body
                )
                response_body = json.loads(response.get('body').read())
                return response_body.get('completion', '')
                
            except ClientError as error:
                if attempt == max_retries - 1:
                    print(f"Final error invoking Claude: {error}")
                    return ""
                time.sleep(1 * (attempt + 1))

    def generate_chunk_summary(self, chunk: str) -> str:
        """Generate a summary for a chunk of text"""
        prompt = f"""Please analyze this section from a financial report and provide a brief, focused summary.
        If the text is in French, provide the summary in English while preserving numerical values.
        Focus on key financial metrics, business insights, and strategic information.

        Text to analyze:
        {chunk}

        Provide a concise summary in 2-3 sentences, highlighting only the most important information."""
        
        return self.claude_invoke(prompt, max_tokens=600)

    def generate_final_summary(self, summaries: List[str]) -> Dict[str, str]:
        """Generate a structured final summary from all chunk summaries"""
        combined_summaries = "\n".join(summaries)
        
        prompt = f"""Based on these extracted summaries from a financial report, please provide a structured analysis in JSON format. Use the following keys: 

        - "executive_summary" (3 sentences maximum)
        - "key_metrics"
        - "performance_highlights"
        - "strategic_initiatives"
        - "risks"
        - "market_position"
        - "future_outlook"

        Source summaries:
        {combined_summaries}

        Please format the response as valid JSON, and ensure each key has a corresponding list of strings or a string if the section is brief. Each list item should be a sentence. Output only the JSON format."""
        
        try:
            response = self.claude_invoke(prompt, max_tokens=1500)
            summary_data = json.loads(response)
            summary_data['analysis_timestamp'] = datetime.now().isoformat()
            return summary_data
        except json.JSONDecodeError:
            print("Response from Claude was:", response)  # Log response for debugging
            raise Exception("Failed to generate properly formatted summary")

    def post(self):
        try:
            # Check if file was uploaded
            if 'file' not in request.files:
                return {
                    'status': 'error',
                    'message': 'No file uploaded'
                }, HTTPStatus.BAD_REQUEST
                
            file = request.files['file']
            
            # Check if file was selected
            if file.filename == '':
                return {
                    'status': 'error',
                    'message': 'No file selected'
                }, HTTPStatus.BAD_REQUEST
                
            # Validate file type
            if not self.allowed_file(file.filename):
                return {
                    'status': 'error',
                    'message': 'Invalid file type. Only PDF files are allowed.'
                }, HTTPStatus.BAD_REQUEST
                
            try:
                # Extract text from PDF
                text = self.extract_text_from_pdf(file)
                
                # Create chunks
                chunks = self.create_chunks(text)
                
                # Generate summaries for chunks with tqdm progress bar
                print("Generating chunk summaries...")
                chunk_summaries = []
                for chunk in tqdm(chunks, desc="Summarizing chunks", unit="chunk"):
                    summary = self.generate_chunk_summary(chunk)
                    chunk_summaries.append(summary)
                
                # Generate final summary
                final_summary = self.generate_final_summary(chunk_summaries)
                
                return {
                    'status': 'success',
                    'data': {
                        'filename': secure_filename(file.filename),
                        'analysis_timestamp': datetime.now().isoformat(),
                        'summary': final_summary,
                        'metadata': {
                            'chunks_processed': len(chunks),
                            'text_length': len(text)
                        }
                    }
                }, HTTPStatus.OK
                
            except Exception as e:
                return {
                    'status': 'error',
                    'message': f'Error processing file: {str(e)}'
                }, HTTPStatus.INTERNAL_SERVER_ERROR
                
        except Exception as e:
            return {
                'status': 'error',
                'message': f'Server error: {str(e)}'
            }, HTTPStatus.INTERNAL_SERVER_ERROR

    def get(self):
        """Endpoint to check service status"""
        return {
            'status': 'success',
            'message': 'Report summarizer service is running',
            'supported_files': list(self.ALLOWED_EXTENSIONS)
        }, HTTPStatus.OK

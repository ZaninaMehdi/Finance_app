# api/services/bedrock_service.py

import os
import boto3
from botocore.exceptions import ClientError
import json

def get_bedrock_client():
    aws_region = os.getenv('AWS_REGION', 'us-west-2')
    bedrock = boto3.client('bedrock-runtime', region_name=aws_region)
    return bedrock

def get_completion(prompt, model_id, system_prompt=None):
    bedrock_client = get_bedrock_client()

    # Préparer la configuration d'inférence
    inference_config = {
        "maxTokens": 200,
        "temperature": 0.0,
    }

    # Préparer le corps de la requête
    request_body = {
        "inputText": prompt,
        "inferenceParameters": inference_config,
    }

    if system_prompt:
        request_body["systemPrompt"] = system_prompt

    try:
        response = bedrock_client.invoke_model(
            modelId=model_id,
            accept='application/json',
            contentType='application/json',
            body=json.dumps(request_body)
        )
        response_body = response['body'].read()
        response_json = json.loads(response_body)
        text_content = response_json.get('results', [{}])[0].get('outputText', '')
        return text_content

    except ClientError as err:
        message = err.response['Error']['Message']
        print(f"Une erreur client est survenue : {message}")
        return None
    except Exception as e:
        print(f"Une erreur inattendue est survenue : {e}")
        return None

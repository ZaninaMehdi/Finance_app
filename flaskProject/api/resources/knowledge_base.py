from ..services.knowledge_base_service import get_knowledge_base, create_knowledge_base
from ..services.bucket_service import create_bucket, bucketExists
from flask_restful import Resource, reqparse

class KnowledgeBase(Resource):
    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('company', type=str, required=True, help="Le symbole de l'entreprise est requis", location='args')
        company = parser.parse_args()['company']

        if not bucketExists(company):
            create_bucket(company)

        knowledge_base = get_knowledge_base()
        return knowledge_base
# api/resources/bedrock.py

from flask_restful import Resource, reqparse
from api.services.bedrock_service import get_completion

class BedrockResource(Resource):
    def post(self):
        parser = reqparse.RequestParser()
        parser.add_argument('prompt', type=str, required=True, help="Le prompt est requis")
        parser.add_argument('model_id', type=str, required=True, help="L'ID du modèle est requis")
        parser.add_argument('system_prompt', type=str, required=False)
        args = parser.parse_args()

        prompt = args['prompt']
        model_id = args['model_id']
        system_prompt = args.get('system_prompt')

        try:
            completion = get_completion(prompt, model_id, system_prompt)
            if completion is not None:
                return {'completion': completion}, 200
            else:
                return {'message': "Erreur lors de la génération de la complétion"}, 500
        except Exception as e:
            return {'message': f"Erreur interne du serveur : {str(e)}"}, 500

# api/models/company.py

class CompanyModel:
    def __init__(self, name, financial_data):
        self.name = name
        self.financial_data = financial_data

    def to_dict(self):
        return {
            'name': self.name,
            'financial_data': self.financial_data
        }

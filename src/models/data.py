from src.models.user import db

class DashboardData(db.Model):
    __tablename__ = 'dashboard_data'
    
    id = db.Column(db.Integer, primary_key=True)
    tipo = db.Column(db.String(100), nullable=False)
    valor = db.Column(db.Integer, nullable=False)
    categoria = db.Column(db.String(100), nullable=False)
    colaborador = db.Column(db.String(100), nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'tipo': self.tipo,
            'valor': self.valor,
            'categoria': self.categoria,
            'colaborador': self.colaborador
        }


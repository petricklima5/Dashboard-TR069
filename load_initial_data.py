#!/usr/bin/env python3
import os
import sys
import csv

# Add the project root to the Python path
sys.path.insert(0, os.path.dirname(__file__))

from src.main import app
from src.models.user import db
from src.models.data import DashboardData

def load_initial_data():
    """Carrega os dados iniciais do CSV fornecido"""
    csv_path = os.path.join(os.path.dirname(__file__), 'data', 'DADOSTR069-Dados.csv')
    
    with app.app_context():
        # Cria todas as tabelas
        db.create_all()
        
        # Limpa dados existentes se a tabela existir
        try:
            db.session.query(DashboardData).delete()
        except:
            pass
        
        # Lê o CSV
        count = 0
        with open(csv_path, 'r', encoding='utf-8') as file:
            csv_reader = csv.DictReader(file)
            
            # Insere novos dados
            for row in csv_reader:
                data_entry = DashboardData(
                    tipo=str(row['Tipo:']).strip(),
                    valor=int(row['Valor:']),
                    categoria=str(row['Categoria:']).strip(),
                    colaborador=str(row['Colaborador:']).strip()
                )
                db.session.add(data_entry)
                count += 1
        
        db.session.commit()
        print(f"Dados carregados com sucesso! {count} registros importados.")

if __name__ == '__main__':
    load_initial_data()


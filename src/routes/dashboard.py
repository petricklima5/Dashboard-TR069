from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import csv
import io
import os
from src.models.data import db, DashboardData

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/upload-csv', methods=['POST'])
def upload_csv():
    """Endpoint para upload de arquivo CSV"""
    if 'file' not in request.files:
        return jsonify({'error': 'Nenhum arquivo enviado'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Nenhum arquivo selecionado'}), 400
    
    if file and file.filename.endswith('.csv'):
        try:
            # Lê o CSV
            file_content = file.read().decode('utf-8')
            csv_reader = csv.DictReader(io.StringIO(file_content))
            
            # Verifica se as colunas necessárias existem
            required_columns = ['Tipo:', 'Valor:', 'Categoria:', 'Colaborador:']
            if not all(col in csv_reader.fieldnames for col in required_columns):
                return jsonify({'error': 'CSV deve conter as colunas: Tipo:, Valor:, Categoria:, Colaborador:'}), 400
            
            # Limpa dados existentes
            db.session.query(DashboardData).delete()
            
            # Insere novos dados
            count = 0
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
            
            return jsonify({
                'success': True, 
                'message': f'CSV processado com sucesso. {count} registros importados.'
            })
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'Erro ao processar CSV: {str(e)}'}), 500
    
    return jsonify({'error': 'Arquivo deve ser um CSV'}), 400

@dashboard_bp.route('/data', methods=['GET'])
def get_data():
    """Endpoint para obter dados com filtros"""
    colaborador = request.args.get('colaborador')
    categoria = request.args.get('categoria')
    tipo = request.args.get('tipo')
    
    query = DashboardData.query
    
    if colaborador:
        query = query.filter(DashboardData.colaborador == colaborador)
    if categoria:
        query = query.filter(DashboardData.categoria == categoria)
    if tipo:
        query = query.filter(DashboardData.tipo == tipo)
    
    data = query.all()
    return jsonify([item.to_dict() for item in data])

@dashboard_bp.route('/filters', methods=['GET'])
def get_filters():
    """Endpoint para obter opções de filtros"""
    colaboradores = db.session.query(DashboardData.colaborador).distinct().all()
    categorias = db.session.query(DashboardData.categoria).distinct().all()
    tipos = db.session.query(DashboardData.tipo).distinct().all()
    
    return jsonify({
        'colaboradores': [c[0] for c in colaboradores],
        'categorias': [c[0] for c in categorias],
        'tipos': [t[0] for t in tipos]
    })

@dashboard_bp.route('/summary', methods=['GET'])
def get_summary():
    """Endpoint para obter resumo dos dados"""
    colaborador = request.args.get('colaborador')
    categoria = request.args.get('categoria')
    tipo = request.args.get('tipo')
    
    query = DashboardData.query
    
    if colaborador:
        query = query.filter(DashboardData.colaborador == colaborador)
    if categoria:
        query = query.filter(DashboardData.categoria == categoria)
    if tipo:
        query = query.filter(DashboardData.tipo == tipo)
    
    total_registros = query.count()
    total_valor = db.session.query(db.func.sum(DashboardData.valor)).filter(
        query.whereclause if query.whereclause is not None else True
    ).scalar() or 0
    
    # Resumo por categoria
    categoria_summary = db.session.query(
        DashboardData.categoria,
        db.func.sum(DashboardData.valor),
        db.func.count(DashboardData.id)
    ).filter(
        query.whereclause if query.whereclause is not None else True
    ).group_by(DashboardData.categoria).all()
    
    # Resumo por colaborador
    colaborador_summary = db.session.query(
        DashboardData.colaborador,
        db.func.sum(DashboardData.valor),
        db.func.count(DashboardData.id)
    ).filter(
        query.whereclause if query.whereclause is not None else True
    ).group_by(DashboardData.colaborador).all()
    
    return jsonify({
        'total_registros': total_registros,
        'total_valor': total_valor,
        'por_categoria': [
            {'categoria': cat, 'valor': val, 'registros': count}
            for cat, val, count in categoria_summary
        ],
        'por_colaborador': [
            {'colaborador': col, 'valor': val, 'registros': count}
            for col, val, count in colaborador_summary
        ]
    })


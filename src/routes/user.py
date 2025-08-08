from flask import Blueprint, jsonify, request
from src.models.user import User, db

user_bp = Blueprint('user', __name__)

@user_bp.route('/users', methods=['GET'])
def get_users():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

@user_bp.route('/users', methods=['POST'])
def create_user():
    
    data = request.json
    user = User(username=data['username'], email=data['email'])
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201

@user_bp.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())

@user_bp.route('/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.json
    user.username = data.get('username', user.username)
    user.email = data.get('email', user.email)
    db.session.commit()
    return jsonify(user.to_dict())

@user_bp.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return '', 204


@user_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    password = data.get("password")
    if password == "TR069Dashboard2024": # Senha única
        # Em um ambiente real, usaria sessões ou JWT
        return jsonify({"success": True, "authenticated": True})
    return jsonify({"success": False, "message": "Senha incorreta."}), 401

@user_bp.route("/check-auth", methods=["GET"])
def check_auth():
    # Em um ambiente real, verificaria a sessão ou token
    # Por simplicidade, assumimos autenticado se a página de login não for mostrada
    return jsonify({"authenticated": True})

@user_bp.route("/logout", methods=["POST"])
def logout():
    # Em um ambiente real, limparia a sessão ou invalidaria o token
    return jsonify({"success": True})



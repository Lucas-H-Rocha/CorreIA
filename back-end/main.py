from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash
import os

app = Flask(__name__)
CORS(app)

DATABASE = 'correai.db'

def conectar_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def inicializar_db():
    conn = conectar_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            senha TEXT NOT NULL,
            peso_inicial REAL,
            objetivo TEXT,
            pace_base TEXT,
            frequencia INTEGER,
            meta_mensal INTEGER DEFAULT 100,
            idade INTEGER,
            tipo TEXT DEFAULT 'user'
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS corridas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER,
            data TEXT,
            distancia REAL,
            tempo TEXT,
            rota TEXT,
            sugestao_ia TEXT,
            distancia_alvo TEXT,
            FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
        )
    ''')
    
    conn.commit()
    conn.close()

# ============================================================
# ROTAS DE AUTENTICAÇÃO
# ============================================================

@app.route('/cadastro', methods=['POST'])
def cadastro():
    dados = request.json
    nome = dados.get('nome')
    email = dados.get('email')
    senha_pura = dados.get('senha')
    peso = dados.get('peso')
    objetivo = dados.get('distancia_alvo')
    pace = dados.get('pace')
    frequencia = dados.get('frequencia', 3)

    senha_hash = generate_password_hash(senha_pura)

    try:
        conn = conectar_db()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO usuarios (nome, email, senha, peso_inicial, objetivo, pace_base, frequencia)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (nome, email, senha_hash, peso, objetivo, pace, frequencia))
        
        user_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({"sucesso": True, "id": user_id, "nome": nome, "tipo": "user"}), 201
    except sqlite3.IntegrityError:
        return jsonify({"sucesso": False, "mensagem": "Este e-mail já está registado."}), 400

@app.route('/login', methods=['POST'])
def login():
    dados = request.json
    email = dados.get('email')
    senha_digitada = dados.get('senha')

    conn = conectar_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM usuarios WHERE email = ?', (email,))
    usuario = cursor.fetchone()
    conn.close()

    if usuario and check_password_hash(usuario['senha'], senha_digitada):
        return jsonify({"sucesso": True, "id": usuario['id'], "nome": usuario['nome'], "tipo": usuario['tipo']})
    else:
        return jsonify({"sucesso": False, "mensagem": "E-mail ou palavra-passe incorretos."}), 401

# ============================================================
# ROTAS DE TREINOS E PERFIL
# ============================================================

@app.route('/registrar_corrida', methods=['POST'])
def registrar_corrida():
    dados = request.json
    u_id = dados.get('usuario_id')
    dist = float(dados.get('distancia'))
    
    sugestao = f"Treino Sugerido para {dist}k: {round(dist * 1.2, 1)}km"
    
    conn = conectar_db()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO corridas (usuario_id, data, distancia, tempo, rota, sugestao_ia, distancia_alvo)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (u_id, dados.get('data'), dist, dados.get('tempo'), dados.get('rota'), sugestao, f"{dist}K"))
    
    conn.commit()
    conn.close()
    return jsonify({"sucesso": True, "sugestao": sugestao})

@app.route('/historico', methods=['GET'])
def historico():
    u_id = request.args.get('usuario_id')
    tipo = request.args.get('tipo')
    
    conn = conectar_db()
    cursor = conn.cursor()
    
    # CORREÇÃO CRÍTICA: Lógica para o Administrador carregar todos os logs
    if tipo == 'admin':
        cursor.execute('''
            SELECT c.*, u.nome 
            FROM corridas c 
            JOIN usuarios u ON c.usuario_id = u.id 
            ORDER BY c.data DESC
        ''')
    else:
        cursor.execute('SELECT * FROM corridas WHERE usuario_id = ? ORDER BY data DESC', (u_id,))
        
    corridas = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(corridas)

@app.route('/deletar_corrida/<int:treino_id>', methods=['DELETE'])
def deletar_corrida(treino_id):
    try:
        conn = conectar_db()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM corridas WHERE id = ?', (treino_id,))
        conn.commit()
        conn.close()
        return jsonify({"sucesso": True, "mensagem": "Treino apagado"})
    except Exception as e:
        return jsonify({"sucesso": False, "mensagem": str(e)}), 500

@app.route('/progresso', methods=['GET'])
def progresso():
    u_id = request.args.get('usuario_id')
    conn = conectar_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT meta_mensal FROM usuarios WHERE id = ?', (u_id,))
    user_row = cursor.fetchone()
    
    if user_row is None:
        conn.close()
        return jsonify({"total_corrido": 0, "meta": 100})
        
    meta = user_row['meta_mensal']
    
    cursor.execute('SELECT SUM(distancia) as total FROM corridas WHERE usuario_id = ?', (u_id,))
    total_row = cursor.fetchone()
    total = total_row['total'] if total_row['total'] else 0
    
    conn.close()
    return jsonify({"total_corrido": round(total, 1), "meta": meta})

# ============================================================
# ROTAS DE ADMINISTRAÇÃO E ESTATÍSTICAS
# ============================================================

@app.route('/admin/stats', methods=['GET'])
def admin_stats():
    try:
        conn = conectar_db()
        cursor = conn.cursor()

        cursor.execute('SELECT COUNT(*) as total FROM usuarios WHERE tipo = "user"')
        total_users = cursor.fetchone()['total']

        cursor.execute('SELECT COUNT(*) as total FROM corridas')
        total_treinos = cursor.fetchone()['total']

        cursor.execute('SELECT SUM(distancia) as total FROM corridas')
        total_km_row = cursor.fetchone()
        total_km = round(total_km_row['total'], 1) if total_km_row['total'] else 0

        cursor.execute('SELECT id, nome, email, meta_mensal, objetivo FROM usuarios WHERE tipo = "user" ORDER BY id DESC')
        
        usuarios = []
        for row in cursor.fetchall():
            u = dict(row)
            u['criado_em'] = '2026-04-27T12:00:00' 
            usuarios.append(u)

        conn.close()

        return jsonify({
            "total_users": total_users,
            "total_treinos": total_treinos,
            "total_km": total_km,
            "usuarios": usuarios
        })
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@app.route('/admin/limpar', methods=['DELETE'])
def admin_limpar():
    try:
        conn = conectar_db()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM corridas')
        conn.commit()
        conn.close()
        return jsonify({"sucesso": True, "mensagem": "Base de dados limpa."})
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@app.route('/admin/deletar_usuario/<int:usuario_id>', methods=['DELETE'])
def admin_deletar_usuario(usuario_id):
    try:
        conn = conectar_db()
        cursor = conn.cursor()
        
        # Apaga os treinos primeiro, depois o utilizador
        cursor.execute('DELETE FROM corridas WHERE usuario_id = ?', (usuario_id,))
        cursor.execute('DELETE FROM usuarios WHERE id = ?', (usuario_id,))
        
        conn.commit()
        conn.close()
        return jsonify({"sucesso": True, "mensagem": "Utilizador apagado com sucesso."})
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@app.route('/make_admin/<email>')
def make_admin(email):
    conn = conectar_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE usuarios SET tipo = 'admin' WHERE email = ?", (email,))
    conn.commit()
    conn.close()
    return f"<h1>Sucesso!</h1><p>O utilizador <b>{email}</b> agora é um Administrador do sistema!</p>"

if __name__ == '__main__':
    inicializar_db()
    app.run(debug=True)
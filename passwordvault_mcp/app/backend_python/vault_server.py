"""
PasswordVault MCP — Flask API Server
Skynet Secure Vault v1.0

API REST pour communication WPF ↔ Python backend
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from typing import Dict, List
import traceback

from storage_manager import storage
from hibp_checker import hibp
from models import VaultEntry, HIBPResult, SecurityAuditResult


app = Flask(__name__)
CORS(app)  # Allow requests from WPF client

# Configuration
app.config['JSON_SORT_KEYS'] = False
app.config['SECRET_KEY'] = 'skynet-vault-secret-key-change-in-production'


# ==================== Health Check ====================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'PasswordVault Python Backend',
        'version': '1.0'
    })


# ==================== Vault Management ====================

@app.route('/vault/create', methods=['POST'])
def create_vault():
    """
    Crée un nouveau vault

    Body: {"master_password": "..."}
    """
    try:
        data = request.get_json()
        master_password = data.get('master_password')

        if not master_password:
            return jsonify({'error': 'Master password required'}), 400

        if storage.vault_exists():
            return jsonify({'error': 'Vault already exists'}), 400

        storage.create_vault(master_password)

        return jsonify({
            'success': True,
            'message': 'Vault created successfully'
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/vault/unlock', methods=['POST'])
def unlock_vault():
    """
    Déverrouille le vault

    Body: {"master_password": "..."}
    """
    try:
        data = request.get_json()
        master_password = data.get('master_password')

        if not master_password:
            return jsonify({'error': 'Master password required'}), 400

        success = storage.unlock_vault(master_password)

        if success:
            return jsonify({
                'success': True,
                'message': 'Vault unlocked',
                'entry_count': len(storage.entries)
            })
        else:
            return jsonify({'error': 'Invalid master password'}), 401

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/vault/lock', methods=['POST'])
def lock_vault():
    """Verrouille le vault"""
    try:
        storage.lock_vault()
        return jsonify({
            'success': True,
            'message': 'Vault locked'
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/vault/status', methods=['GET'])
def vault_status():
    """Statut du vault"""
    return jsonify({
        'exists': storage.vault_exists(),
        'is_unlocked': storage.is_unlocked,
        'entry_count': len(storage.entries) if storage.is_unlocked else 0
    })


# ==================== Entry Management ====================

@app.route('/vault/entries', methods=['GET'])
def get_entries():
    """
    Récupère toutes les entrées

    Query params:
        - search: terme de recherche (optionnel)
    """
    try:
        if not storage.is_unlocked:
            return jsonify({'error': 'Vault is locked'}), 403

        search_query = request.args.get('search', '').strip()

        if search_query:
            entries = storage.search_entries(search_query)
        else:
            entries = storage.get_entries()

        return jsonify({
            'success': True,
            'entries': [entry.to_dict() for entry in entries],
            'count': len(entries)
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/vault/entry/<entry_id>', methods=['GET'])
def get_entry(entry_id: str):
    """Récupère une entrée par ID"""
    try:
        if not storage.is_unlocked:
            return jsonify({'error': 'Vault is locked'}), 403

        entry = storage.get_entry(entry_id)

        if entry:
            return jsonify({
                'success': True,
                'entry': entry.to_dict()
            })
        else:
            return jsonify({'error': 'Entry not found'}), 404

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/vault/entry/add', methods=['POST'])
def add_entry():
    """
    Ajoute une nouvelle entrée

    Body: {
        "website": "...",
        "username": "...",
        "password": "...",
        "notes": "...",
        "category": "...",
        "tags": [...]
    }
    """
    try:
        if not storage.is_unlocked:
            return jsonify({'error': 'Vault is locked'}), 403

        data = request.get_json()

        # Validation
        if not data.get('website'):
            return jsonify({'error': 'Website required'}), 400
        if not data.get('password'):
            return jsonify({'error': 'Password required'}), 400

        # Créer entrée
        entry = VaultEntry(
            website=data['website'],
            username=data.get('username', ''),
            password=data['password'],
            notes=data.get('notes', ''),
            category=data.get('category', 'web'),
            tags=data.get('tags', [])
        )

        entry_id = storage.add_entry(entry)

        return jsonify({
            'success': True,
            'message': 'Entry added',
            'entry_id': entry_id,
            'entry': entry.to_dict()
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/vault/entry/update/<entry_id>', methods=['PUT'])
def update_entry(entry_id: str):
    """
    Met à jour une entrée

    Body: mêmes champs que add_entry
    """
    try:
        if not storage.is_unlocked:
            return jsonify({'error': 'Vault is locked'}), 403

        data = request.get_json()

        # Créer entrée mise à jour
        updated_entry = VaultEntry(
            website=data['website'],
            username=data.get('username', ''),
            password=data['password'],
            notes=data.get('notes', ''),
            category=data.get('category', 'web'),
            tags=data.get('tags', [])
        )

        success = storage.update_entry(entry_id, updated_entry)

        if success:
            return jsonify({
                'success': True,
                'message': 'Entry updated',
                'entry': updated_entry.to_dict()
            })
        else:
            return jsonify({'error': 'Entry not found'}), 404

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/vault/entry/delete/<entry_id>', methods=['DELETE'])
def delete_entry(entry_id: str):
    """Supprime une entrée"""
    try:
        if not storage.is_unlocked:
            return jsonify({'error': 'Vault is locked'}), 403

        success = storage.delete_entry(entry_id)

        if success:
            return jsonify({
                'success': True,
                'message': 'Entry deleted'
            })
        else:
            return jsonify({'error': 'Entry not found'}), 404

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== Security ====================

@app.route('/vault/hibp/check', methods=['POST'])
def check_hibp():
    """
    Vérifie un mot de passe via HIBP

    Body: {"password": "..."} ou {"hash": "..."}
    """
    try:
        data = request.get_json()

        if 'password' in data:
            result = hibp.check_password(data['password'])
        elif 'hash' in data:
            result = hibp.check_password_hash(data['hash'])
        else:
            return jsonify({'error': 'Password or hash required'}), 400

        return jsonify({
            'success': True,
            'result': result.to_dict()
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/vault/audit/all', methods=['POST'])
def audit_all_entries():
    """
    Audit de sécurité de toutes les entrées

    TODO: Implémenter avec IA (via MCP)
    """
    try:
        if not storage.is_unlocked:
            return jsonify({'error': 'Vault is locked'}), 403

        # TODO: Appeler MCP pour audit IA
        # Pour l'instant, juste HIBP check

        results = []
        for entry in storage.get_entries():
            hibp_result = hibp.check_password(entry.password)

            audit = SecurityAuditResult(
                entry_id=entry.id,
                score=100 if not hibp_result.breached else 50,
                weaknesses=['Password found in breach'] if hibp_result.breached else [],
                recommendations=['Change this password immediately'] if hibp_result.breached else [],
                hibp_result=hibp_result
            )

            results.append(audit.to_dict())

        return jsonify({
            'success': True,
            'audits': results,
            'count': len(results)
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== Sync ====================

@app.route('/vault/sync/export', methods=['GET'])
def export_vault_for_sync():
    """Exporte le vault chiffré pour sync"""
    try:
        if not storage.is_unlocked:
            return jsonify({'error': 'Vault is locked'}), 403

        vault_data = storage.get_vault_for_sync()

        return jsonify({
            'success': True,
            'vault': vault_data
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== Main ====================

if __name__ == '__main__':
    print("🔐 PasswordVault Python Backend")
    print("=" * 50)
    print("Starting Flask server on http://localhost:5555")
    print("Press Ctrl+C to stop")
    print()

    app.run(
        host='127.0.0.1',
        port=5555,
        debug=True,
        threaded=True
    )

"""
Skynet Memory Visualizer - Flask Backend
Main API server for memory management and visualization
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import yaml
import logging
from pathlib import Path

# Import modules
from rag_loader import RAGLoader
from file_manager import FileManager
from tag_manager import TagManager
from history_manager import HistoryManager
from compare_engine import CompareEngine
from ai_bridge import AIBridge

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for Tauri

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load configuration
with open('config.yaml', 'r') as f:
    config = yaml.safe_load(f)

# Initialize managers
rag_loader = RAGLoader(config)
file_manager = FileManager(config)
tag_manager = TagManager(config)
history_manager = HistoryManager(config)
compare_engine = CompareEngine()
ai_bridge = AIBridge(config)

# === Health & Stats Endpoints ===

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'version': '1.0.0'})

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get system statistics"""
    try:
        stats = {
            'total_docs': file_manager.count_documents(),
            'rag_size': rag_loader.get_index_size(),
            'total_tags': tag_manager.count_tags(),
            'recent_edits': history_manager.count_recent_edits(hours=24)
        }
        return jsonify(stats)
    except Exception as e:
        logger.error(f"Failed to get stats: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/timeline', methods=['GET'])
def get_timeline():
    """Get recent activity timeline"""
    try:
        limit = request.args.get('limit', 20, type=int)
        timeline = history_manager.get_timeline(limit=limit)
        return jsonify(timeline)
    except Exception as e:
        logger.error(f"Failed to get timeline: {e}")
        return jsonify({'error': str(e)}), 500

# === Search Endpoints ===

@app.route('/api/search', methods=['GET'])
def search():
    """Search documents"""
    try:
        query = request.args.get('q', '')
        if not query:
            return jsonify({'error': 'Query parameter required'}), 400

        results = rag_loader.search(query)
        return jsonify(results)
    except Exception as e:
        logger.error(f"Search failed: {e}")
        return jsonify({'error': str(e)}), 500

# === File Management Endpoints ===

@app.route('/api/files/tree', methods=['GET'])
def get_file_tree():
    """Get file tree structure"""
    try:
        path = request.args.get('path', '/')
        tree = file_manager.get_tree(path)
        return jsonify(tree)
    except Exception as e:
        logger.error(f"Failed to get file tree: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/files/load', methods=['GET'])
def load_file():
    """Load a document"""
    try:
        path = request.args.get('path')
        if not path:
            return jsonify({'error': 'Path parameter required'}), 400

        document = file_manager.load_document(path)

        # Enrich with tags and metadata
        document['tags'] = tag_manager.get_tags(path)
        document['metadata'] = rag_loader.get_metadata(path)

        return jsonify(document)
    except Exception as e:
        logger.error(f"Failed to load file: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/files/save', methods=['POST'])
def save_file():
    """Save a document"""
    try:
        data = request.get_json()
        path = data.get('path')
        content = data.get('content')

        if not path or content is None:
            return jsonify({'error': 'Path and content required'}), 400

        # Save file
        result = file_manager.save_document(path, content)

        # Create version
        history_manager.create_version(path, content)

        # Update RAG index
        rag_loader.update_document(path, content)

        return jsonify(result)
    except Exception as e:
        logger.error(f"Failed to save file: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/files/delete', methods=['DELETE'])
def delete_file():
    """Delete a document"""
    try:
        data = request.get_json()
        path = data.get('path')

        if not path:
            return jsonify({'error': 'Path required'}), 400

        result = file_manager.delete_document(path)
        rag_loader.remove_document(path)

        return jsonify(result)
    except Exception as e:
        logger.error(f"Failed to delete file: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/files/rename', methods=['POST'])
def rename_file():
    """Rename a document"""
    try:
        data = request.get_json()
        old_path = data.get('old_path')
        new_path = data.get('new_path')

        if not old_path or not new_path:
            return jsonify({'error': 'Old and new paths required'}), 400

        result = file_manager.rename_document(old_path, new_path)
        rag_loader.rename_document(old_path, new_path)

        return jsonify(result)
    except Exception as e:
        logger.error(f"Failed to rename file: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/files/preview', methods=['GET'])
def get_file_preview():
    """Get file preview (first N lines)"""
    try:
        path = request.args.get('path')
        lines = request.args.get('lines', 5, type=int)

        if not path:
            return jsonify({'error': 'Path required'}), 400

        preview = file_manager.get_preview(path, lines)
        return jsonify({'preview': preview})
    except Exception as e:
        logger.error(f"Failed to get preview: {e}")
        return jsonify({'error': str(e)}), 500

# === Tag Management Endpoints ===

@app.route('/api/tags/get', methods=['GET'])
def get_tags():
    """Get tags for a document"""
    try:
        path = request.args.get('path')
        if not path:
            return jsonify({'error': 'Path required'}), 400

        tags = tag_manager.get_tags(path)
        return jsonify(tags)
    except Exception as e:
        logger.error(f"Failed to get tags: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/tags/add', methods=['POST'])
def add_tag():
    """Add a tag to a document"""
    try:
        data = request.get_json()
        path = data.get('path')
        tag = data.get('tag')

        if not path or not tag:
            return jsonify({'error': 'Path and tag required'}), 400

        result = tag_manager.add_tag(path, tag)
        return jsonify(result)
    except Exception as e:
        logger.error(f"Failed to add tag: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/tags/remove', methods=['DELETE'])
def remove_tag():
    """Remove a tag from a document"""
    try:
        data = request.get_json()
        path = data.get('path')
        tag = data.get('tag')

        if not path or not tag:
            return jsonify({'error': 'Path and tag required'}), 400

        result = tag_manager.remove_tag(path, tag)
        return jsonify(result)
    except Exception as e:
        logger.error(f"Failed to remove tag: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/tags/all', methods=['GET'])
def get_all_tags():
    """Get all tags"""
    try:
        tags = tag_manager.get_all_tags()
        return jsonify(tags)
    except Exception as e:
        logger.error(f"Failed to get all tags: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/tags/filter', methods=['GET'])
def filter_by_tag():
    """Filter documents by tag"""
    try:
        tag = request.args.get('tag')
        if not tag:
            return jsonify({'error': 'Tag required'}), 400

        documents = tag_manager.filter_by_tag(tag)
        return jsonify(documents)
    except Exception as e:
        logger.error(f"Failed to filter by tag: {e}")
        return jsonify({'error': str(e)}), 500

# === Metadata Endpoints ===

@app.route('/api/metadata/get', methods=['GET'])
def get_metadata():
    """Get document metadata"""
    try:
        path = request.args.get('path')
        if not path:
            return jsonify({'error': 'Path required'}), 400

        metadata = rag_loader.get_metadata(path)
        return jsonify(metadata)
    except Exception as e:
        logger.error(f"Failed to get metadata: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/metadata/save', methods=['POST'])
def save_metadata():
    """Save document metadata"""
    try:
        data = request.get_json()
        path = data.get('path')
        metadata = data.get('metadata')

        if not path or not metadata:
            return jsonify({'error': 'Path and metadata required'}), 400

        result = rag_loader.save_metadata(path, metadata)
        return jsonify(result)
    except Exception as e:
        logger.error(f"Failed to save metadata: {e}")
        return jsonify({'error': str(e)}), 500

# === Version History Endpoints ===

@app.route('/api/history/list', methods=['GET'])
def get_history():
    """Get version history for a document"""
    try:
        path = request.args.get('path')
        if not path:
            return jsonify({'error': 'Path required'}), 400

        history = history_manager.get_versions(path)
        return jsonify(history)
    except Exception as e:
        logger.error(f"Failed to get history: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/history/version', methods=['GET'])
def get_version():
    """Get a specific version"""
    try:
        path = request.args.get('path')
        version_id = request.args.get('version')

        if not path or not version_id:
            return jsonify({'error': 'Path and version required'}), 400

        version = history_manager.get_version(path, version_id)
        return jsonify(version)
    except Exception as e:
        logger.error(f"Failed to get version: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/history/restore', methods=['POST'])
def restore_version():
    """Restore a previous version"""
    try:
        data = request.get_json()
        path = data.get('path')
        version_id = data.get('version_id')

        if not path or not version_id:
            return jsonify({'error': 'Path and version_id required'}), 400

        result = history_manager.restore_version(path, version_id)
        return jsonify(result)
    except Exception as e:
        logger.error(f"Failed to restore version: {e}")
        return jsonify({'error': str(e)}), 500

# === Compare Endpoints ===

@app.route('/api/compare/diff', methods=['POST'])
def generate_diff():
    """Generate diff between two texts"""
    try:
        data = request.get_json()
        text_a = data.get('text_a', '')
        text_b = data.get('text_b', '')

        diff = compare_engine.diff(text_a, text_b)
        return jsonify(diff)
    except Exception as e:
        logger.error(f"Failed to generate diff: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/compare/export', methods=['POST'])
def export_diff():
    """Export diff to file"""
    try:
        data = request.get_json()
        path = data.get('path')
        diff = data.get('diff')

        if not path or not diff:
            return jsonify({'error': 'Path and diff required'}), 400

        result = compare_engine.export_diff(path, diff)
        return jsonify(result)
    except Exception as e:
        logger.error(f"Failed to export diff: {e}")
        return jsonify({'error': str(e)}), 500

# === AI Endpoints ===

@app.route('/api/ai/suggest-tags', methods=['POST'])
def suggest_tags():
    """AI tag suggestions"""
    try:
        data = request.get_json()
        content = data.get('content')

        if not content:
            return jsonify({'error': 'Content required'}), 400

        tags = ai_bridge.suggest_tags(content)
        return jsonify(tags)
    except Exception as e:
        logger.error(f"Failed to suggest tags: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/ai/regenerate', methods=['POST'])
def ai_regenerate():
    """Regenerate document with AI"""
    try:
        data = request.get_json()
        content = data.get('content')
        prompt_type = data.get('prompt_type', 'regenerate_doc')

        if not content:
            return jsonify({'error': 'Content required'}), 400

        result = ai_bridge.regenerate(content, prompt_type)
        return jsonify({'result': result})
    except Exception as e:
        logger.error(f"Failed to regenerate: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/ai/summarize', methods=['POST'])
def ai_summarize():
    """Summarize document with AI"""
    try:
        data = request.get_json()
        content = data.get('content')
        level = data.get('level', 'medium')

        if not content:
            return jsonify({'error': 'Content required'}), 400

        summary = ai_bridge.summarize(content, level)
        return jsonify({'summary': summary})
    except Exception as e:
        logger.error(f"Failed to summarize: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/ai/extract-metadata', methods=['POST'])
def ai_extract_metadata():
    """Extract metadata with AI"""
    try:
        data = request.get_json()
        content = data.get('content')

        if not content:
            return jsonify({'error': 'Content required'}), 400

        metadata = ai_bridge.extract_metadata(content)
        return jsonify(metadata)
    except Exception as e:
        logger.error(f"Failed to extract metadata: {e}")
        return jsonify({'error': str(e)}), 500

# === RAG Endpoints ===

@app.route('/api/rag/refresh', methods=['POST'])
def refresh_index():
    """Refresh RAG index"""
    try:
        result = rag_loader.refresh_index()
        return jsonify(result)
    except Exception as e:
        logger.error(f"Failed to refresh index: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/rag/status', methods=['GET'])
def get_rag_status():
    """Get RAG index status"""
    try:
        status = rag_loader.get_status()
        return jsonify(status)
    except Exception as e:
        logger.error(f"Failed to get RAG status: {e}")
        return jsonify({'error': str(e)}), 500

# === Main ===

if __name__ == '__main__':
    port = config.get('app', {}).get('port', 5432)
    debug = config.get('app', {}).get('debug', False)

    logger.info(f"Starting Skynet Memory Visualizer Backend on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)

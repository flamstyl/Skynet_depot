"""
Web interface routes
"""
from flask import Blueprint, render_template

web_bp = Blueprint('web', __name__)

@web_bp.route('/builder')
def builder():
    """Render the visual builder interface"""
    return render_template('builder.html')

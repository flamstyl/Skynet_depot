#!/bin/bash
# ============================================================================
# MCP KALI LINUX - Analyseur de Logs pour IA
# ============================================================================
# Ce script prépare et structure les logs pour analyse par une IA
# Il génère un résumé formaté en Markdown pour faciliter l'interprétation
# ============================================================================

set -euo pipefail

# ============================================================================
# CONFIGURATION
# ============================================================================
LOGS_DIR="/logs"
AI_CONTEXT_DIR="/ai_context"
RESULTS_DIR="${LOGS_DIR}/results"

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================================================
# FONCTIONS UTILITAIRES
# ============================================================================
log() {
    local level=$1
    shift
    local message="$@"
    echo "[${level}] $(date '+%Y-%m-%d %H:%M:%S') - ${message}"
}

# ============================================================================
# FONCTION : Extraire les informations clés d'un scan Nmap
# ============================================================================
analyze_nmap() {
    local nmap_file=$1
    local output=""

    if [ ! -f "$nmap_file" ]; then
        return 1
    fi

    log INFO "Analyse du fichier Nmap: $(basename $nmap_file)"

    output+="#### Analyse Nmap\n\n"

    # Extraire les ports ouverts
    local open_ports=$(grep -E "^[0-9]+/(tcp|udp)" "$nmap_file" | grep "open" || true)
    if [ -n "$open_ports" ]; then
        output+="**Ports ouverts détectés:**\n"
        output+="\`\`\`\n"
        output+="$open_ports\n"
        output+="\`\`\`\n\n"
    fi

    # Extraire les services
    local services=$(grep -E "Service Info:" "$nmap_file" || true)
    if [ -n "$services" ]; then
        output+="**Informations sur les services:**\n"
        output+="\`\`\`\n"
        output+="$services\n"
        output+="\`\`\`\n\n"
    fi

    # Compter les ports ouverts
    local port_count=$(echo "$open_ports" | grep -c "open" || echo "0")
    output+="**Statistiques:**\n"
    output+="- Nombre de ports ouverts: ${port_count}\n\n"

    # Détection de services critiques
    if echo "$open_ports" | grep -qE "(22|23|3389|5900)"; then
        output+="⚠️ **ATTENTION:** Services d'accès à distance détectés (SSH/Telnet/RDP/VNC)\n\n"
    fi

    if echo "$open_ports" | grep -qE "(80|443|8080|8443)"; then
        output+="🌐 **INFO:** Services web détectés\n\n"
    fi

    if echo "$open_ports" | grep -qE "(3306|5432|1433|27017)"; then
        output+="🗄️ **INFO:** Services de base de données détectés\n\n"
    fi

    echo -e "$output"
}

# ============================================================================
# FONCTION : Extraire les vulnérabilités Nikto
# ============================================================================
analyze_nikto() {
    local nikto_file=$1
    local output=""

    if [ ! -f "$nikto_file" ]; then
        return 1
    fi

    log INFO "Analyse du fichier Nikto: $(basename $nikto_file)"

    output+="#### Analyse Nikto (Vulnérabilités Web)\n\n"

    # Compter les vulnérabilités trouvées
    local vuln_count=$(grep -c "OSVDB" "$nikto_file" 2>/dev/null || echo "0")

    output+="**Statistiques:**\n"
    output+="- Vulnérabilités potentielles détectées: ${vuln_count}\n\n"

    # Extraire les items critiques (si détectés)
    local critical=$(grep -i "critical\|severe\|high" "$nikto_file" || true)
    if [ -n "$critical" ]; then
        output+="⚠️ **VULNÉRABILITÉS CRITIQUES DÉTECTÉES:**\n"
        output+="\`\`\`\n"
        output+="$critical\n"
        output+="\`\`\`\n\n"
    fi

    # Top 10 des findings
    local top_findings=$(grep "+" "$nikto_file" | head -10 || true)
    if [ -n "$top_findings" ]; then
        output+="**Top 10 des découvertes:**\n"
        output+="\`\`\`\n"
        output+="$top_findings\n"
        output+="\`\`\`\n\n"
    fi

    echo -e "$output"
}

# ============================================================================
# FONCTION : Analyser les sous-domaines
# ============================================================================
analyze_subdomains() {
    local subdomain_file=$1
    local output=""

    if [ ! -f "$subdomain_file" ]; then
        return 1
    fi

    log INFO "Analyse du fichier de sous-domaines: $(basename $subdomain_file)"

    output+="#### Énumération de Sous-domaines\n\n"

    local subdomain_count=$(wc -l < "$subdomain_file" || echo "0")

    output+="**Statistiques:**\n"
    output+="- Nombre de sous-domaines trouvés: ${subdomain_count}\n\n"

    if [ "$subdomain_count" -gt 0 ]; then
        output+="**Sous-domaines découverts:**\n"
        output+="\`\`\`\n"
        cat "$subdomain_file"
        output+="\`\`\`\n\n"

        # Rechercher des sous-domaines intéressants
        local interesting=$(grep -iE "admin|dev|staging|test|api|vpn|mail|ftp" "$subdomain_file" || true)
        if [ -n "$interesting" ]; then
            output+="⚠️ **Sous-domaines potentiellement sensibles:**\n"
            output+="\`\`\`\n"
            output+="$interesting\n"
            output+="\`\`\`\n\n"
        fi
    fi

    echo -e "$output"
}

# ============================================================================
# FONCTION : Analyser les directories web
# ============================================================================
analyze_directories() {
    local dir_file=$1
    local output=""

    if [ ! -f "$dir_file" ]; then
        return 1
    fi

    log INFO "Analyse des directories: $(basename $dir_file)"

    output+="#### Scan de Directories Web\n\n"

    # Compter les directories trouvés
    local dir_count=$(grep -c "Status: 200\|Status: 301\|Status: 302" "$dir_file" 2>/dev/null || echo "0")

    output+="**Statistiques:**\n"
    output+="- Répertoires/fichiers accessibles: ${dir_count}\n\n"

    # Extraire les paths intéressants
    local interesting=$(grep -E "admin|config|backup|test|dev|api|upload" "$dir_file" || true)
    if [ -n "$interesting" ]; then
        output+="⚠️ **Paths potentiellement sensibles:**\n"
        output+="\`\`\`\n"
        output+="$interesting\n"
        output+="\`\`\`\n\n"
    fi

    # Top 20 des découvertes
    local top_dirs=$(grep "Status: 200\|Status: 301" "$dir_file" | head -20 || true)
    if [ -n "$top_dirs" ]; then
        output+="**Top 20 des répertoires découverts:**\n"
        output+="\`\`\`\n"
        output+="$top_dirs\n"
        output+="\`\`\`\n\n"
    fi

    echo -e "$output"
}

# ============================================================================
# FONCTION : Générer un résumé global
# ============================================================================
generate_summary() {
    local mission_dir=$1
    local output_file="${AI_CONTEXT_DIR}/summary_for_ai.md"

    log INFO "Génération du résumé pour analyse IA..."

    # En-tête
    cat > "$output_file" <<EOF
# Résumé d'Analyse MCP Kali - Pour Traitement IA

**Date de génération:** $(date '+%Y-%m-%d %H:%M:%S')
**Mission:** $(basename $mission_dir)
**Répertoire de résultats:** ${mission_dir}

---

## 📋 Vue d'ensemble

Ce document contient un résumé structuré des scans de sécurité effectués.
Il est optimisé pour être analysé par une IA (Claude, GPT, etc.) afin de :

1. Identifier les vulnérabilités critiques
2. Prioriser les risques
3. Générer des recommandations de sécurité
4. Créer un rapport exécutif

---

## 📊 Résultats des Scans

EOF

    # Analyser chaque type de fichier
    for nmap_file in "${mission_dir}"/../nmap_*.txt 2>/dev/null; do
        if [ -f "$nmap_file" ]; then
            analyze_nmap "$nmap_file" >> "$output_file"
        fi
    done

    for nikto_file in "${mission_dir}"/../nikto_*.txt 2>/dev/null; do
        if [ -f "$nikto_file" ]; then
            analyze_nikto "$nikto_file" >> "$output_file"
        fi
    done

    for subdomain_file in "${mission_dir}"/../subdomains_*.txt 2>/dev/null; do
        if [ -f "$subdomain_file" ]; then
            analyze_subdomains "$subdomain_file" >> "$output_file"
        fi
    done

    for dir_file in "${mission_dir}"/../directories_*.txt 2>/dev/null; do
        if [ -f "$dir_file" ]; then
            analyze_directories "$dir_file" >> "$output_file"
        fi
    done

    # Ajouter des sections pour l'IA
    cat >> "$output_file" <<EOF

---

## 🤖 Instructions pour l'IA Analyseur

### Tâches à effectuer:

1. **Analyse de Risques**
   - Identifier les vulnérabilités critiques et leur impact
   - Prioriser selon le modèle CVSS ou équivalent
   - Déterminer les vecteurs d'attaque possibles

2. **Corrélation**
   - Croiser les informations des différents scans
   - Identifier les patterns de configuration dangereuse
   - Détecter les services obsolètes ou mal configurés

3. **Recommandations**
   - Proposer des mesures correctives concrètes
   - Prioriser les actions par ordre d'urgence
   - Fournir des exemples de configuration sécurisée

4. **Rapport Exécutif**
   - Résumer en 3-5 points clés pour management
   - Inclure un score de risque global (0-10)
   - Proposer un plan d'action avec timeline

### Format de sortie attendu:

Utiliser le template dans: ${AI_CONTEXT_DIR}/report_template.md

---

## 📎 Fichiers Bruts Disponibles

EOF

    # Lister tous les fichiers de résultats
    echo "Les fichiers bruts complets sont disponibles dans:" >> "$output_file"
    echo "\`\`\`" >> "$output_file"
    ls -lh "${mission_dir}"/../*.txt 2>/dev/null | awk '{print $9, "-", $5}' >> "$output_file" || echo "Aucun fichier trouvé"
    echo "\`\`\`" >> "$output_file"

    log INFO "Résumé généré: ${output_file}"
    echo -e "${GREEN}✓${NC} Résumé prêt pour analyse IA"

    return 0
}

# ============================================================================
# FONCTION : Détecter les indicateurs de compromission (IoC)
# ============================================================================
detect_iocs() {
    local mission_dir=$1

    log INFO "Recherche d'indicateurs de compromission..."

    # Liste de patterns suspects
    local suspicious_patterns=(
        "backdoor"
        "shell.php"
        "eval("
        "base64_decode"
        "cmd.exe"
        "powershell"
        "/etc/passwd"
        "/etc/shadow"
    )

    local ioc_file="${AI_CONTEXT_DIR}/iocs_detected.txt"
    > "$ioc_file"  # Vider le fichier

    for pattern in "${suspicious_patterns[@]}"; do
        for scan_file in "${mission_dir}"/../*.txt 2>/dev/null; do
            if [ -f "$scan_file" ]; then
                if grep -qi "$pattern" "$scan_file"; then
                    echo "⚠️ Pattern suspect '$pattern' trouvé dans $(basename $scan_file)" >> "$ioc_file"
                    log WARN "IoC détecté: $pattern dans $(basename $scan_file)"
                fi
            fi
        done
    done

    if [ -s "$ioc_file" ]; then
        log WARN "Indicateurs de compromission détectés ! Voir: ${ioc_file}"
        return 1
    else
        log INFO "Aucun IoC évident détecté"
        echo "Aucun indicateur de compromission détecté" > "$ioc_file"
        return 0
    fi
}

# ============================================================================
# MAIN
# ============================================================================
main() {
    local mission_dir=${1:-$RESULTS_DIR}

    log INFO "=========================================="
    log INFO "Analyseur de Logs MCP Kali"
    log INFO "=========================================="

    if [ ! -d "$mission_dir" ]; then
        log ERROR "Répertoire de mission non trouvé: ${mission_dir}"
        exit 1
    fi

    log INFO "Analyse du répertoire: ${mission_dir}"

    # Générer le résumé principal
    generate_summary "$mission_dir"

    # Détecter les IoCs
    detect_iocs "$mission_dir"

    log INFO "Analyse terminée !"
    log INFO "Résumé disponible dans: ${AI_CONTEXT_DIR}/summary_for_ai.md"

    echo ""
    echo -e "${BLUE}════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✓ Logs analysés et structurés pour traitement IA${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════${NC}"
    echo ""
    echo "Prochaines étapes recommandées:"
    echo "1. Lire le résumé: cat ${AI_CONTEXT_DIR}/summary_for_ai.md"
    echo "2. Fournir ce résumé à une IA pour analyse approfondie"
    echo "3. Générer le rapport final avec les recommandations"
    echo ""

    return 0
}

# Lancer l'analyseur
main "$@"

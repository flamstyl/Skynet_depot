#!/bin/bash
# ============================================================================
# MCP KALI LINUX - Agent d'Orchestration IA
# ============================================================================
# Ce script est le pont entre l'IA et l'environnement Kali
# Il surveille les missions, exécute les commandes, et génère les rapports
# ============================================================================

set -euo pipefail

# ============================================================================
# CONFIGURATION
# ============================================================================
AI_CONTEXT_DIR="/ai_context"
LOGS_DIR="/logs"
MISSION_FILE="${AI_CONTEXT_DIR}/mission.json"
STATUS_FILE="${AI_CONTEXT_DIR}/status.json"
COMMANDS_FILE="${AI_CONTEXT_DIR}/commands.json"
RESULTS_DIR="${LOGS_DIR}/results"
SCAN_INTERVAL=5  # secondes

# Couleurs pour output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# ============================================================================
# INITIALISATION
# ============================================================================
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[${level}] ${timestamp} - ${message}" | tee -a "${LOGS_DIR}/mcp_agent.log"
}

# Créer les dossiers nécessaires
mkdir -p "$RESULTS_DIR"
mkdir -p "${AI_CONTEXT_DIR}"

log INFO "🟣 Agent MCP démarré"
log INFO "Surveillance du fichier: ${MISSION_FILE}"

# ============================================================================
# FONCTION : Initialiser le statut
# ============================================================================
init_status() {
    cat > "$STATUS_FILE" <<EOF
{
  "agent_status": "running",
  "last_check": "$(date -Iseconds)",
  "current_mission": null,
  "mission_status": "idle",
  "tasks_completed": 0,
  "tasks_failed": 0
}
EOF
    log INFO "Statut initialisé"
}

# ============================================================================
# FONCTION : Mettre à jour le statut
# ============================================================================
update_status() {
    local mission_status=$1
    local mission_id=${2:-null}

    if [ ! -f "$STATUS_FILE" ]; then
        init_status
    fi

    # Utiliser jq si disponible, sinon reconstruction simple
    if command -v jq &> /dev/null; then
        jq --arg status "$mission_status" \
           --arg timestamp "$(date -Iseconds)" \
           --arg mission "$mission_id" \
           '.mission_status = $status | .last_check = $timestamp | .current_mission = $mission' \
           "$STATUS_FILE" > "${STATUS_FILE}.tmp" && mv "${STATUS_FILE}.tmp" "$STATUS_FILE"
    else
        # Fallback sans jq
        cat > "$STATUS_FILE" <<EOF
{
  "agent_status": "running",
  "last_check": "$(date -Iseconds)",
  "current_mission": "${mission_id}",
  "mission_status": "${mission_status}"
}
EOF
    fi
}

# ============================================================================
# FONCTION : Parser la mission JSON
# ============================================================================
parse_mission() {
    if [ ! -f "$MISSION_FILE" ]; then
        return 1
    fi

    # Vérifier que le fichier n'est pas vide
    if [ ! -s "$MISSION_FILE" ]; then
        return 1
    fi

    # Parser avec jq si disponible
    if command -v jq &> /dev/null; then
        if ! jq empty "$MISSION_FILE" 2>/dev/null; then
            log ERROR "Fichier mission.json invalide (JSON malformé)"
            return 1
        fi
        return 0
    else
        # Vérification basique sans jq
        if grep -q "target" "$MISSION_FILE" 2>/dev/null; then
            return 0
        fi
        return 1
    fi
}

# ============================================================================
# FONCTION : Exécuter un scan Nmap
# ============================================================================
run_nmap_scan() {
    local target=$1
    local output_file="${RESULTS_DIR}/nmap_$(date +%Y%m%d_%H%M%S).txt"

    log INFO "Démarrage scan Nmap sur ${target}..."

    # Scan basique avec détection de services
    nmap -sV -sC -oN "$output_file" "$target" 2>&1 | tee -a "${LOGS_DIR}/mcp_agent.log"

    if [ $? -eq 0 ]; then
        log INFO "Scan Nmap terminé: ${output_file}"
        echo "$output_file"
        return 0
    else
        log ERROR "Échec du scan Nmap"
        return 1
    fi
}

# ============================================================================
# FONCTION : Exécuter un scan avec Nikto
# ============================================================================
run_nikto_scan() {
    local target=$1
    local output_file="${RESULTS_DIR}/nikto_$(date +%Y%m%d_%H%M%S).txt"

    log INFO "Démarrage scan Nikto sur ${target}..."

    # Nikto scan de vulnérabilités web
    nikto -h "$target" -output "$output_file" 2>&1 | tee -a "${LOGS_DIR}/mcp_agent.log"

    if [ $? -eq 0 ]; then
        log INFO "Scan Nikto terminé: ${output_file}"
        echo "$output_file"
        return 0
    else
        log ERROR "Échec du scan Nikto"
        return 1
    fi
}

# ============================================================================
# FONCTION : Découverte de sous-domaines
# ============================================================================
run_subdomain_enum() {
    local domain=$1
    local output_file="${RESULTS_DIR}/subdomains_$(date +%Y%m%d_%H%M%S).txt"

    log INFO "Énumération de sous-domaines pour ${domain}..."

    # Utiliser subfinder si disponible
    if command -v subfinder &> /dev/null; then
        subfinder -d "$domain" -o "$output_file" 2>&1 | tee -a "${LOGS_DIR}/mcp_agent.log"
    else
        # Fallback: utilisation de nslookup/dig basique
        log WARN "subfinder non disponible, énumération limitée"
        for sub in www mail ftp admin api dev staging; do
            if nslookup "${sub}.${domain}" &>/dev/null; then
                echo "${sub}.${domain}" >> "$output_file"
            fi
        done
    fi

    if [ -f "$output_file" ] && [ -s "$output_file" ]; then
        log INFO "Sous-domaines trouvés: $(wc -l < $output_file)"
        echo "$output_file"
        return 0
    else
        log WARN "Aucun sous-domaine trouvé"
        return 1
    fi
}

# ============================================================================
# FONCTION : Scanner de directories web
# ============================================================================
run_directory_scan() {
    local target=$1
    local output_file="${RESULTS_DIR}/directories_$(date +%Y%m%d_%H%M%S).txt"

    log INFO "Scan de directories web sur ${target}..."

    # Utiliser gobuster si disponible
    if command -v gobuster &> /dev/null; then
        # Liste de mots commune pour directories
        local wordlist="/usr/share/wordlists/dirb/common.txt"
        if [ ! -f "$wordlist" ]; then
            wordlist="/usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt"
        fi

        if [ -f "$wordlist" ]; then
            gobuster dir -u "$target" -w "$wordlist" -o "$output_file" 2>&1 | tee -a "${LOGS_DIR}/mcp_agent.log"
        else
            log WARN "Aucune wordlist trouvée pour gobuster"
            return 1
        fi
    else
        log WARN "gobuster non disponible"
        return 1
    fi

    if [ -f "$output_file" ] && [ -s "$output_file" ]; then
        log INFO "Scan de directories terminé: ${output_file}"
        echo "$output_file"
        return 0
    else
        log WARN "Aucun répertoire trouvé"
        return 1
    fi
}

# ============================================================================
# FONCTION : Exécuter une mission
# ============================================================================
execute_mission() {
    local mission_file=$1

    log INFO "=========================================="
    log INFO "Exécution de la mission"
    log INFO "=========================================="

    # Parser la mission
    if ! parse_mission; then
        log ERROR "Impossible de parser la mission"
        update_status "error"
        return 1
    fi

    # Extraire les informations de la mission
    local target
    local objectives
    local mission_id="mission_$(date +%Y%m%d_%H%M%S)"

    if command -v jq &> /dev/null; then
        target=$(jq -r '.target // empty' "$mission_file")
        objectives=$(jq -r '.objectives[]? // empty' "$mission_file")
    else
        # Fallback basique sans jq
        target=$(grep -oP '"target"\s*:\s*"\K[^"]+' "$mission_file" | head -1)
        objectives=$(grep -oP '"objectives"\s*:\s*\[\s*"\K[^"]+' "$mission_file")
    fi

    if [ -z "$target" ]; then
        log ERROR "Aucune cible spécifiée dans la mission"
        update_status "error"
        return 1
    fi

    log INFO "Cible: ${target}"
    log INFO "Objectifs: ${objectives}"

    update_status "running" "$mission_id"

    # Créer un dossier pour cette mission
    local mission_dir="${RESULTS_DIR}/${mission_id}"
    mkdir -p "$mission_dir"

    # Fichier de rapport de la mission
    local report_file="${mission_dir}/report.md"

    # Initialiser le rapport
    cat > "$report_file" <<EOF
# Rapport de Mission MCP Kali
## Mission ID: ${mission_id}
## Date: $(date '+%Y-%m-%d %H:%M:%S')
## Cible: ${target}

---

## Objectifs
${objectives}

---

## Résultats des Scans

EOF

    # Exécuter les scans selon les objectifs
    log INFO "Démarrage des scans..."

    # 1. Scan Nmap (toujours)
    if run_nmap_scan "$target"; then
        local nmap_result=$?
        echo "### Scan Nmap" >> "$report_file"
        echo "\`\`\`" >> "$report_file"
        cat "${RESULTS_DIR}"/nmap_*.txt | tail -n 100 >> "$report_file"
        echo "\`\`\`" >> "$report_file"
        echo "" >> "$report_file"
    fi

    # 2. Scan Nikto si cible est une URL HTTP
    if [[ "$target" =~ ^https?:// ]]; then
        if run_nikto_scan "$target"; then
            echo "### Scan Nikto (Vulnérabilités Web)" >> "$report_file"
            echo "\`\`\`" >> "$report_file"
            cat "${RESULTS_DIR}"/nikto_*.txt | tail -n 100 >> "$report_file"
            echo "\`\`\`" >> "$report_file"
            echo "" >> "$report_file"
        fi

        # 3. Scan directories
        if run_directory_scan "$target"; then
            echo "### Directories Web Découverts" >> "$report_file"
            echo "\`\`\`" >> "$report_file"
            cat "${RESULTS_DIR}"/directories_*.txt | tail -n 50 >> "$report_file"
            echo "\`\`\`" >> "$report_file"
            echo "" >> "$report_file"
        fi
    fi

    # 4. Énumération sous-domaines si cible est un domaine
    if [[ ! "$target" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] && [[ ! "$target" =~ ^https?:// ]]; then
        if run_subdomain_enum "$target"; then
            echo "### Sous-domaines Découverts" >> "$report_file"
            echo "\`\`\`" >> "$report_file"
            cat "${RESULTS_DIR}"/subdomains_*.txt >> "$report_file"
            echo "\`\`\`" >> "$report_file"
            echo "" >> "$report_file"
        fi
    fi

    # Finaliser le rapport
    cat >> "$report_file" <<EOF

---

## Conclusion

Mission ${mission_id} terminée avec succès.
Tous les résultats sont disponibles dans: ${mission_dir}/

**Note**: Ce rapport est généré automatiquement. Une analyse approfondie par l'IA est recommandée.

---

## Recommandations

TODO: L'IA devra analyser les résultats et fournir des recommandations de sécurité.

EOF

    log INFO "Rapport généré: ${report_file}"

    # Appeler le script d'analyse des logs
    if [ -f "/mcp/analyze_logs.sh" ]; then
        log INFO "Lancement de l'analyse des logs..."
        /mcp/analyze_logs.sh "$mission_dir"
    fi

    update_status "completed" "$mission_id"

    log INFO "Mission ${mission_id} terminée !"
    log INFO "Rapport disponible: ${report_file}"

    # Archiver la mission traitée
    mv "$MISSION_FILE" "${AI_CONTEXT_DIR}/mission_${mission_id}_completed.json"

    return 0
}

# ============================================================================
# FONCTION : Boucle principale de surveillance
# ============================================================================
watch_missions() {
    log INFO "Démarrage de la surveillance des missions..."

    init_status

    while true; do
        # Vérifier si une nouvelle mission est disponible
        if [ -f "$MISSION_FILE" ]; then
            log INFO "Nouvelle mission détectée !"

            # Exécuter la mission
            if execute_mission "$MISSION_FILE"; then
                log INFO "Mission exécutée avec succès"
            else
                log ERROR "Échec de l'exécution de la mission"
            fi
        else
            # Mise à jour du statut en idle
            update_status "idle"
        fi

        # Attendre avant le prochain scan
        sleep "$SCAN_INTERVAL"
    done
}

# ============================================================================
# FONCTION : Nettoyage à l'arrêt
# ============================================================================
cleanup() {
    log INFO "Arrêt de l'agent MCP..."
    update_status "stopped"
    exit 0
}

trap cleanup SIGTERM SIGINT

# ============================================================================
# MAIN
# ============================================================================
main() {
    log INFO "🟣 MCP Agent initialisé"
    log INFO "Mode: Surveillance continue"
    log INFO "Interval: ${SCAN_INTERVAL}s"

    # Lancer la boucle de surveillance
    watch_missions
}

# Lancer l'agent
main "$@"

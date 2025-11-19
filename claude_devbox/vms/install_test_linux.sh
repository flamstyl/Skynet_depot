#!/bin/bash

# Claude DevBox - Linux VM Test Script
# Automated testing on Linux VM

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VM_LAUNCHER="$SCRIPT_DIR/qemu_launcher.sh"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Test code in Linux VM
test_code() {
    local CODE_FILE="$1"
    local LANGUAGE="$2"
    local OUTPUT_FILE="$3"

    log_info "Testing $LANGUAGE code in Linux VM..."

    # Ensure VM is running
    if ! bash "$VM_LAUNCHER" status > /dev/null 2>&1; then
        log_info "Starting VM..."
        bash "$VM_LAUNCHER" start
        sleep 10 # Wait for VM to boot
    fi

    # Create test directory in VM
    bash "$VM_LAUNCHER" exec "mkdir -p /home/devbox/test"

    # Copy code to VM
    bash "$VM_LAUNCHER" copy-to "$CODE_FILE" "/home/devbox/test/"

    # Get filename
    local FILENAME=$(basename "$CODE_FILE")

    # Execute based on language
    case "$LANGUAGE" in
        python)
            log_info "Running Python code..."
            bash "$VM_LAUNCHER" exec "cd /home/devbox/test && python3 $FILENAME" > "$OUTPUT_FILE" 2>&1
            ;;
        javascript|node)
            log_info "Running Node.js code..."
            bash "$VM_LAUNCHER" exec "cd /home/devbox/test && node $FILENAME" > "$OUTPUT_FILE" 2>&1
            ;;
        java)
            log_info "Compiling and running Java code..."
            bash "$VM_LAUNCHER" exec "cd /home/devbox/test && javac $FILENAME && java ${FILENAME%.java}" > "$OUTPUT_FILE" 2>&1
            ;;
        rust)
            log_info "Compiling and running Rust code..."
            bash "$VM_LAUNCHER" exec "cd /home/devbox/test && rustc $FILENAME -o test && ./test" > "$OUTPUT_FILE" 2>&1
            ;;
        go)
            log_info "Running Go code..."
            bash "$VM_LAUNCHER" exec "cd /home/devbox/test && go run $FILENAME" > "$OUTPUT_FILE" 2>&1
            ;;
        cpp|c++)
            log_info "Compiling and running C++ code..."
            bash "$VM_LAUNCHER" exec "cd /home/devbox/test && g++ $FILENAME -o test && ./test" > "$OUTPUT_FILE" 2>&1
            ;;
        *)
            log_error "Unsupported language: $LANGUAGE"
            return 1
            ;;
    esac

    local EXIT_CODE=$?

    # Cleanup
    bash "$VM_LAUNCHER" exec "rm -rf /home/devbox/test"

    if [ $EXIT_CODE -eq 0 ]; then
        log_success "Test completed successfully"
        return 0
    else
        log_error "Test failed with exit code $EXIT_CODE"
        return 1
    fi
}

# Run test suite
run_test_suite() {
    local TEST_DIR="$1"

    log_info "Running test suite from: $TEST_DIR"

    local PASSED=0
    local FAILED=0

    # Find all test files
    for TEST_FILE in "$TEST_DIR"/*; do
        if [ -f "$TEST_FILE" ]; then
            local FILENAME=$(basename "$TEST_FILE")
            local EXTENSION="${FILENAME##*.}"

            # Detect language from extension
            local LANGUAGE=""
            case "$EXTENSION" in
                py) LANGUAGE="python" ;;
                js) LANGUAGE="javascript" ;;
                java) LANGUAGE="java" ;;
                rs) LANGUAGE="rust" ;;
                go) LANGUAGE="go" ;;
                cpp|cc) LANGUAGE="cpp" ;;
                *) continue ;;
            esac

            log_info "Testing: $FILENAME ($LANGUAGE)"

            local OUTPUT_FILE="/tmp/test_output_${FILENAME}.log"

            if test_code "$TEST_FILE" "$LANGUAGE" "$OUTPUT_FILE"; then
                ((PASSED++))
                echo "  ✓ PASSED"
            else
                ((FAILED++))
                echo "  ✗ FAILED"
                echo "  Output:"
                cat "$OUTPUT_FILE" | sed 's/^/    /'
            fi

            echo ""
        fi
    done

    log_info "Test Results: $PASSED passed, $FAILED failed"

    if [ $FAILED -eq 0 ]; then
        log_success "All tests passed!"
        return 0
    else
        log_error "Some tests failed"
        return 1
    fi
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies in VM..."

    bash "$VM_LAUNCHER" exec "sudo apt-get update -qq"
    bash "$VM_LAUNCHER" exec "sudo apt-get install -y python3 python3-pip nodejs npm default-jdk rustc cargo golang-go g++"

    log_success "Dependencies installed"
}

# Main
main() {
    local COMMAND="${1:-help}"

    case "$COMMAND" in
        test)
            test_code "$2" "$3" "${4:-/tmp/test_output.log}"
            ;;
        suite)
            run_test_suite "$2"
            ;;
        install-deps)
            install_dependencies
            ;;
        help|*)
            echo "Claude DevBox - Linux VM Test Script"
            echo ""
            echo "Usage: $0 <command> [args]"
            echo ""
            echo "Commands:"
            echo "  test <file> <language> [output]  Test single file"
            echo "  suite <dir>                      Run test suite from directory"
            echo "  install-deps                     Install dependencies in VM"
            echo "  help                             Show this help"
            echo ""
            echo "Supported languages: python, javascript, java, rust, go, cpp"
            ;;
    esac
}

main "$@"

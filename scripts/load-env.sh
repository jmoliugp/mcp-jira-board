#!/bin/bash

# Load environment variables from .env file (check current and parent directories)

# Function to load .env file
load_env_file() {
    local env_file="$1"
    if [ -f "$env_file" ]; then
        echo "📄 Loading environment from: $env_file"
        # Export variables from .env file
        while IFS= read -r line; do
            # Skip comments and empty lines
            if [[ ! "$line" =~ ^[[:space:]]*# ]] && [[ -n "$line" ]]; then
                # Export the variable
                export "$line"
            fi
        done < "$env_file"
        return 0
    fi
    return 1
}

# Try to load .env from current directory first, then parent directory
if load_env_file ".env"; then
    echo "✅ Environment loaded from current directory"
elif load_env_file "../.env"; then
    echo "✅ Environment loaded from parent directory"
else
    echo "⚠️  No .env file found in current or parent directory"
    echo "   You can create one manually or run: pnpm docker:setup"
fi 
#!/bin/sh
set -e

# Function to hash a string with SHA-256
hash_password() {
  if [ -z "$1" ]; then
    echo ""
  else
    echo -n "$1" | sha256sum | cut -d ' ' -f 1
  fi
}

# Function to replace environment variables in HTML files
replace_env_vars() {
  # Hash the password if it exists
  local password_hash=""
  if [ -n "$PASSWORD" ]; then
    password_hash=$(hash_password "$PASSWORD")
  fi

  # Replace the password placeholder in all HTML files with the hashed password
  find /usr/share/nginx/html -type f -name "*.html" -exec sed -i "s/window.__ENV__.PASSWORD = \"{{PASSWORD}}\";/window.__ENV__.PASSWORD = \"${password_hash}\";/g" {} \;
  
  echo "Environment variables have been injected into HTML files."
}

# Replace environment variables in HTML files
replace_env_vars

# Execute the command provided as arguments
exec "$@"
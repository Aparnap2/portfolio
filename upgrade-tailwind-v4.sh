#!/bin/bash
# Upgrade to Tailwind CSS v4 script
# Run this only if you want to upgrade to v4

echo "Upgrading to Tailwind CSS v4..."

# Remove old Tailwind
npm uninstall tailwindcss autoprefixer

# Install Tailwind CSS v4
npm install @tailwindcss/postcss@next

# Update globals.css for v4
echo "Update your app/globals.css to:"
echo "@import 'tailwindcss';"
echo ""
echo "And remove the @tailwind directives"
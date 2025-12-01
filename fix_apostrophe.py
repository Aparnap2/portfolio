import re

# Read the file
with open('src/app/component/chatbot/chatbot.jsx', 'r') as f:
    content = f.read()

# Replace the apostrophe with HTML entity
content = re.sub(
    r'Aparna\'s',
    r'Aparna&apos;s',
    content
)

# Write back to file
with open('src/app/component/chatbot/chatbot.jsx', 'w') as f:
    f.write(content)

print("Successfully replaced apostrophe with &apos;")

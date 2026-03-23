import os, glob

replacements = {
    'dracula-bg': 'bg',
    'dracula-cur': 'cur',
    'dracula-fg': 'fg',
    'dracula-comment': 'comment',
    'dracula-purple': 'primary',
    'dracula-pink': 'secondary',
    'dracula-cyan': 'primary',
    'dracula-green': 'success',
    'dracula-orange': 'warning',
    'dracula-red': 'error',
    'rounded-2xl': 'rounded-[12px]',
    'rounded-xl': 'rounded-[10px]'
}

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.html') or file.endswith('.ts'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            orig = content
            for old, new in replacements.items():
                content = content.replace(old, new)
            if content != orig:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
print('Done!')

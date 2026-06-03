import re
with open('App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'\s+onAddProduct=\{\(\) => setCurrentScreen\(\'add-product\'\)\}', '', content)

with open('App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Removed onAddProduct from App.tsx')
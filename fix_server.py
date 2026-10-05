import re

with open('/Users/luis/.gemini/antigravity/scratch/mecanic-os/backend/src/server.js', 'r') as f:
    content = f.read()

if "initCronJobs" not in content:
    content = "const { initCronJobs } = require('./services/cronJobs');\n" + content
    
    replace_target = "app.listen(PORT, () => {"
    new_code = """
// Inicializar tareas en segundo plano (Vigilante de Cuotas Wompi)
initCronJobs();

app.listen(PORT, () => {"""
    
    content = content.replace(replace_target, new_code)
    
    with open('/Users/luis/.gemini/antigravity/scratch/mecanic-os/backend/src/server.js', 'w') as f:
        f.write(content)
    print("server.js updated")
else:
    print("Already updated")

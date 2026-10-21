# 🚀 Guía de Despliegue en Vercel (ManualBot)

Esta aplicación está completamente configurada y lista para desplegarse en **Vercel** en menos de 2 minutos.

---

## 📋 Archivos ya configurados en el proyecto:
- **`vercel.json`**: Configura Vite como framework, la compilación a `dist/` y el enrutamiento de Serverless Functions (`/api/*` y `/widget.js`).
- **`api/index.ts`**: Función Serverless de Vercel que procesa las consultas de IA y el endpoint del widget.
- **`src/serverApp.ts`**: Servidor unificado con CORS habilitado para que cualquier intranet de tu empresa pueda comunicarse con el bot.

---

## ⚡ Método 1: Despliegue con GitHub y Vercel (Recomendado)

1. **Sube este proyecto a tu repositorio de GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit ManualBot"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/manualbot.git
   git push -u origin main
   ```

2. **Importar en Vercel**:
   - Entra a [vercel.com](https://vercel.com) e inicia sesión.
   - Haz clic en **"Add New..."** ➔ **"Project"**.
   - Selecciona tu repositorio de GitHub e importa el proyecto.

3. **Configurar Variable de Entorno**:
   - En la sección **"Environment Variables"**, añade:
     - **Key (Nombre):** `GEMINI_API_KEY`
     - **Value (Valor):** Tu API Key de Google Gemini (puedes obtener una gratis en [Google AI Studio](https://aistudio.google.com/)).

4. **Hacer clic en "Deploy"**:
   - Vercel compilará automáticamente el frontend con Vite y desplegará las funciones de backend.
   - En ~45 segundos tendrás tu URL pública lista (ejemplo: `https://manualbot-tu-empresa.vercel.app`).

---

## 💻 Método 2: Despliegue directo mediante Vercel CLI

Si tienes instalado Node.js en tu terminal:

1. Ejecuta el comando de Vercel:
   ```bash
   npx vercel
   ```
2. Sigue las instrucciones en pantalla (Vercel detectará automáticamente `vercel.json` y el framework `Vite`).
3. Añade tu API Key:
   ```bash
   npx vercel env add GEMINI_API_KEY
   ```
4. Despliega a producción:
   ```bash
   npx vercel --prod
   ```

---

## 🌐 ¿Cómo usarlo en la web de tu trabajo una vez desplegado en Vercel?

Una vez tengas tu dominio de Vercel (por ejemplo `https://manualbot.vercel.app`):

### 1. Burbuja Flotante de Chat:
Pega esto en el HTML o gestor de tu empresa:
```html
<script
  src="https://manualbot.vercel.app/widget.js"
  data-app-url="https://manualbot.vercel.app"
  data-company="Nombre de Tu Empresa"
  data-color="#4f46e5"
  data-position="bottom-right"
  defer
></script>
```

### 2. Embebido en iFrame:
```html
<iframe
  src="https://manualbot.vercel.app/?mode=widget"
  width="100%"
  height="650"
  style="border: 1px solid #1e293b; border-radius: 16px;"
  title="Asistente de Manuales"
></iframe>
```

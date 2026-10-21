# Telegram Bot - Pending Knowledge Approval

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Telegram bot to the existing chatbot server that sends real-time notifications to admin when new pending knowledge items are created, with inline Approve/Reject buttons.

**Architecture:** Telegram bot runs in the same Node.js process as the Express server. When a pending knowledge item is saved, the server triggers a Telegram notification with inline callback buttons. Admin clicks approve/reject → bot handles callback → updates database.json → syncs to Firebase.

**Tech Stack:** TypeScript, Express, `telegraf`, `node-telegram-bot-api` (alternative), existing `loadDB()`/`saveDB()` helpers

## Global Constraints

- Must run in same Node.js process as existing server.ts
- Must use existing `loadDB()`/`saveDB()` helpers for database access
- Must sync to Firebase when knowledge is approved/rejected (existing `syncToFirestore()`)
- Must support multiple admin chat IDs (stored in database.json)
- Must handle bot errors gracefully (log to console, don't crash server)
- Must not break existing functionality (all current API routes must continue working)
- TypeScript throughout (server.ts is already TypeScript)

---

### Task 1: Install Dependencies and Configure Environment

**Files:**
- Modify: `package.json`
- Modify: `.env.example`
- Modify: `server.ts` (imports section)

**Interfaces:**
- Consumes: None
- Produces: `telegraf` package installed, environment variables configured

- [ ] **Step 1: Install telegraf**

Run: `cd "C:\Users\fabia\Downloads\Fabian PROYECTO\CHATBOT" && npm install telegraf`

Expected: telegraf added to package.json dependencies

- [ ] **Step 2: Update .env.example**

Add to `.env.example`:
```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_ADMIN_CHAT_IDS=123456789,987654321
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json .env.example
git commit -m "feat: add telegraf dependency and telegram env vars"
```

---

### Task 2: Create Telegram Bot Module

**Files:**
- Create: `src/telegram-bot.ts`

**Interfaces:**
- Consumes: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_IDS` from environment
- Produces: `initTelegramBot()`, `notifyPendingKnowledge(item: KnowledgeItem)`, `stopTelegramBot()`

- [ ] **Step 1: Create telegram-bot.ts**

```typescript
import { Telegraf, Markup } from 'telegraf';
import { KnowledgeItem } from './types.js';

let bot: Telegraf | null = null;
let adminChatIds: number[] = [];

/**
 * Initialize the Telegram bot with token and admin chat IDs.
 * Call this once during server startup.
 */
export function initTelegramBot(): boolean {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.log('[TELEGRAM] Bot token not configured. Telegram notifications disabled.');
    return false;
  }

  const chatIdsStr = process.env.TELEGRAM_ADMIN_CHAT_IDS || '';
  adminChatIds = chatIdsStr
    .split(',')
    .map(id => parseInt(id.trim(), 10))
    .filter(id => !isNaN(id));

  if (adminChatIds.length === 0) {
    console.log('[TELEGRAM] No admin chat IDs configured. Telegram notifications disabled.');
    return false;
  }

  try {
    bot = new Telegraf(token);

    // Handle /start command
    bot.start((ctx) => {
      ctx.reply('🤖 Bot de moderación del Asistente Virtual iniciado. Recibirás notificaciones cuando haya conocimientos pendientes de aprobación.');
    });

    // Handle /status command
    bot.command('status', (ctx) => {
      ctx.reply(`✅ Bot activo. Administradores configurados: ${adminChatIds.length}`);
    });

    // Handle callback queries (approve/reject buttons)
    bot.on('callback_query', async (ctx) => {
      const data = ctx.callbackQuery.data;
      
      if (!data || !data.startsWith('approve:') && !data.startsWith('reject:')) {
        return;
      }

      const [action, itemId] = data.split(':');
      
      try {
        // Import loadDB/saveDB dynamically to avoid circular imports
        const { loadDB, saveDB } = await import('./db-helpers.js');
        const db = loadDB();
        db.pendingKnowledge = db.pendingKnowledge || [];
        
        const itemIndex = db.pendingKnowledge.findIndex(item => item.id === itemId);
        
        if (itemIndex === -1) {
          await ctx.answerCbQuery('❌ Este elemento ya fue procesado.');
          return;
        }

        const item = db.pendingKnowledge[itemIndex];

        if (action === 'approve') {
          // Move to active knowledge
          const approvedItem: KnowledgeItem = {
            ...item,
            id: 'k_approved_' + Date.now().toString(36),
            createdAt: new Date().toISOString()
          };
          db.knowledge.push(approvedItem);
          db.pendingKnowledge.splice(itemIndex, 1);
          saveDB(db);

          // Sync to Firebase if connected
          try {
            const { syncToFirestore } = await import('./db-helpers.js');
            await syncToFirestore(db);
          } catch (e) {
            console.log('[TELEGRAM] Firebase sync failed (non-critical):', e);
          }

          await ctx.answerCbQuery('✅ Aprobado');
          await ctx.editMessageText(
            `✅ **APROBADO**\n\n📋 ${item.title}\n📂 ${item.category}\n\nEl conocimiento ha sido añadido a la base activa.`,
            { parse_mode: 'Markdown' }
          );
        } else if (action === 'reject') {
          // Remove from pending
          db.pendingKnowledge.splice(itemIndex, 1);
          saveDB(db);

          // Sync to Firebase if connected
          try {
            const { syncToFirestore } = await import('./db-helpers.js');
            await syncToFirestore(db);
          } catch (e) {
            console.log('[TELEGRAM] Firebase sync failed (non-critical):', e);
          }

          await ctx.answerCbQuery('❌ Rechazado');
          await ctx.editMessageText(
            `❌ **RECHAZADO**\n\n📋 ${item.title}\n\nEl conocimiento pendiente ha sido eliminado.`,
            { parse_mode: 'Markdown' }
          );
        }
      } catch (error: any) {
        console.error('[TELEGRAM] Error handling callback:', error);
        await ctx.answerCbQuery('❌ Error al procesar');
        await ctx.editMessageText(
          `⚠️ **ERROR**\n\nNo se pudo procesar la acción: ${error.message}`,
          { parse_mode: 'Markdown' }
        );
      }
    });

    // Launch bot
    bot.launch().then(() => {
      console.log(`[TELEGRAM] Bot initialized successfully. Admins: ${adminChatIds.join(', ')}`);
    }).catch((err: Error) => {
      console.error('[TELEGRAM] Failed to start bot:', err.message);
      bot = null;
    });

    // Enable graceful stop
    process.once('SIGINT', () => bot?.stop('SIGINT'));
    process.once('SIGTERM', () => bot?.stop('SIGTERM'));

    return true;
  } catch (error: any) {
    console.error('[TELEGRAM] Initialization error:', error.message);
    bot = null;
    return false;
  }
}

/**
 * Send a notification to all admin chat IDs about a new pending knowledge item.
 */
export function notifyPendingKnowledge(item: KnowledgeItem): void {
  if (!bot || adminChatIds.length === 0) {
    return;
  }

  const message = `📋 **NUEVO CONOCIMIENTO PENDIENTE**\n\n` +
    `📌 **Título:** ${item.title}\n` +
    `📂 **Categoría:** ${item.category}\n` +
    `🏷️ **Tipo:** ${item.type === 'faq' ? 'Pregunta Frecuente' : 'Procedimiento'}\n\n` +
    `📝 **Contenido:**\n${item.content.substring(0, 800)}${item.content.length > 800 ? '...' : ''}`;

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('✅ Aprobar', `approve:${item.id}`),
      Markup.button.callback('❌ Rechazar', `reject:${item.id}`)
    ]
  ]);

  adminChatIds.forEach(chatId => {
    bot!.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      ...keyboard
    }).catch((err: Error) => {
      console.error(`[TELEGRAM] Failed to notify admin ${chatId}:`, err.message);
    });
  });
}

/**
 * Stop the Telegram bot gracefully.
 */
export function stopTelegramBot(): void {
  if (bot) {
    bot.stop('SIGTERM');
    bot = null;
    console.log('[TELEGRAM] Bot stopped.');
  }
}
```

- [ ] **Step 2: Create db-helpers.ts (extract DB helpers from server.ts)**

This file extracts the database helpers so telegram-bot.ts can import them without circular dependencies.

```typescript
import fs from 'fs';
import path from 'path';
import { KnowledgeItem, ChatSession, ChatMessage, Reminder } from './types.js';

const DB_FILE = path.join(process.cwd(), 'database.json');

interface DatabaseSchema {
  knowledge: KnowledgeItem[];
  chats: ChatSession[];
  appearance?: any;
  pendingKnowledge?: KnowledgeItem[];
  reminders?: Reminder[];
}

let cachedDB: DatabaseSchema | null = null;

export function loadDB(): DatabaseSchema {
  if (cachedDB) {
    return cachedDB;
  }
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial: DatabaseSchema = {
        knowledge: [],
        chats: [],
        pendingKnowledge: [],
        reminders: []
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      cachedDB = initial;
      return initial;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    const db = JSON.parse(data) as DatabaseSchema;
    db.pendingKnowledge = db.pendingKnowledge || [];
    db.reminders = db.reminders || [];
    cachedDB = db;
    return db;
  } catch (err) {
    console.error('Error reading DB, using initial fallback', err);
    const fallback: DatabaseSchema = {
      knowledge: [],
      chats: [],
      pendingKnowledge: [],
      reminders: []
    };
    cachedDB = fallback;
    return fallback;
  }
}

export function saveDB(db: DatabaseSchema): void {
  cachedDB = db;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database', err);
  }
}

export async function syncToFirestore(db: DatabaseSchema): Promise<void> {
  // Import Firebase dynamically to avoid initialization issues
  try {
    const { getFirestore, doc, setDoc } = await import('firebase/firestore');
    const { getApp } = await import('firebase/app');
    
    const firestoreDb = getFirestore(getApp());
    const docRef = doc(firestoreDb, 'appState', 'current');
    await setDoc(docRef, {
      ...db,
      lastSyncedAt: new Date().toISOString()
    });
    console.log('[FIREBASE] Successfully synchronized database state to Firestore.');
  } catch (error) {
    console.error('[FIREBASE ERROR] Failed to sync database to Firestore:', error);
    throw error;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/telegram-bot.ts src/db-helpers.ts
git commit -m "feat: create telegram bot module with approve/reject callbacks"
```

---

### Task 3: Integrate Telegram Bot into Server

**Files:**
- Modify: `server.ts`

**Interfaces:**
- Consumes: `initTelegramBot()`, `notifyPendingKnowledge()` from telegram-bot.ts
- Produces: Bot initialized on server start, notifications sent when pending items created

- [ ] **Step 1: Add imports to server.ts**

At the top of server.ts, after existing imports:
```typescript
import { initTelegramBot, notifyPendingKnowledge } from './src/telegram-bot.js';
```

- [ ] **Step 2: Initialize bot in startServer()**

Modify the `startServer()` function:
```typescript
async function startServer() {
  // Initialize Telegram bot
  const telegramEnabled = initTelegramBot();
  if (telegramEnabled) {
    console.log('[TELEGRAM] Bot integration enabled.');
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
```

- [ ] **Step 3: Hook into /api/teach endpoint**

Find the `/api/teach` route and add notification after saving:
```typescript
app.post('/api/teach', (req: Request, res: Response) => {
  const { pregunta, respuesta, usuarioId } = req.body;
  if (!pregunta || !respuesta) {
    res.status(400).json({ error: 'Pregunta y respuesta requeridas' });
    return;
  }

  const db = loadDB();
  db.pendingKnowledge = db.pendingKnowledge || [];

  const nuevaEnsenanza: KnowledgeItem = {
    id: 'pending_' + Date.now().toString(36),
    title: pregunta,
    category: 'General',
    content: respuesta,
    type: 'faq',
    createdAt: new Date().toISOString(),
  };

  db.pendingKnowledge.push(nuevaEnsenanza);
  saveDB(db);
  
  // Notify Telegram admins
  notifyPendingKnowledge(nuevaEnsenanza);
  
  res.status(201).json(nuevaEnsenanza);
});
```

- [ ] **Step 4: Hook into /api/pending-knowledge/:id/approve route**

This route already exists but we need to ensure it doesn't conflict with Telegram callbacks. The Telegram bot handles its own approve/reject via callbacks, so the API route remains for web admin panel. No changes needed here - both can coexist.

- [ ] **Step 5: Commit**

```bash
git add server.ts
git commit -m "feat: integrate telegram bot into server startup and teach endpoint"
```

---

### Task 4: Add Telegram Admin Management API

**Files:**
- Modify: `server.ts`

**Interfaces:**
- Consumes: None
- Produces: API routes for managing Telegram admin chat IDs

- [ ] **Step 1: Add Telegram admin management routes**

Add these routes to server.ts (after existing admin routes):
```typescript
// --- TELEGRAM ADMIN MANAGEMENT ---

// Get configured Telegram admin chat IDs
app.get('/api/telegram/admins', (req: Request, res: Response) => {
  const chatIdsStr = process.env.TELEGRAM_ADMIN_CHAT_IDS || '';
  const chatIds = chatIdsStr
    .split(',')
    .map(id => parseInt(id.trim(), 10))
    .filter(id => !isNaN(id));
  
  res.json({
    enabled: !!process.env.TELEGRAM_BOT_TOKEN,
    adminChatIds: chatIds
  });
});

// Add a Telegram admin chat ID (for runtime management)
app.post('/api/telegram/admins', (req: Request, res: Response) => {
  const { chatId } = req.body;
  if (!chatId || isNaN(parseInt(chatId, 10))) {
    res.status(400).json({ error: 'Valid chatId required' });
    return;
  }

  const chatIdsStr = process.env.TELEGRAM_ADMIN_CHAT_IDS || '';
  const chatIds = chatIdsStr.split(',').map(id => id.trim()).filter(id => id);
  
  const newChatId = chatId.toString();
  if (chatIds.includes(newChatId)) {
    res.status(409).json({ error: 'Chat ID already configured' });
    return;
  }

  chatIds.push(newChatId);
  process.env.TELEGRAM_ADMIN_CHAT_IDS = chatIds.join(',');
  
  res.json({ success: true, adminChatIds: chatIds });
});

// Remove a Telegram admin chat ID
app.delete('/api/telegram/admins/:chatId', (req: Request, res: Response) => {
  const { chatId } = req.params;
  const chatIdsStr = process.env.TELEGRAM_ADMIN_CHAT_IDS || '';
  const chatIds = chatIdsStr.split(',').map(id => id.trim()).filter(id => id);
  
  const filtered = chatIds.filter(id => id !== chatId);
  if (filtered.length === chatIds.length) {
    res.status(404).json({ error: 'Chat ID not found' });
    return;
  }

  process.env.TELEGRAM_ADMIN_CHAT_IDS = filtered.join(',');
  res.json({ success: true, adminChatIds: filtered });
});
```

- [ ] **Step 2: Commit**

```bash
git add server.ts
git commit -m "feat: add telegram admin management API routes"
```

---

### Task 5: Test and Verify

**Files:**
- Test: Manual testing via curl/Postman
- Test: Telegram bot interaction

**Interfaces:**
- Consumes: All previous tasks
- Produces: Verified working Telegram integration

- [ ] **Step 1: Verify server starts without errors**

Run: `cd "C:\Users\fabia\Downloads\Fabian PROYECTO\CHATBOT" && npm run dev`

Expected output:
```
[TELEGRAM] Bot initialized successfully. Admins: <your_chat_id>
Server running on http://localhost:3000
```

- [ ] **Step 2: Test pending knowledge creation**

Run:
```bash
curl -X POST http://localhost:3000/api/teach \
  -H "Content-Type: application/json" \
  -d "{\"pregunta\":\"¿Cómo solicito vacaciones?\",\"respuesta\":\"Enviar correo a RRHH con 15 días de anticipación\"}"
```

Expected: You receive a Telegram message with the pending item and Approve/Reject buttons.

- [ ] **Step 3: Test approve button**

Click ✅ Aprobar in Telegram. Expected:
- Message updates to "✅ APROBADO"
- Item appears in `/api/knowledge` endpoint
- Item removed from `/api/pending-knowledge`

- [ ] **Step 4: Test reject button**

Create another pending item, click ❌ Rechazar. Expected:
- Message updates to "❌ RECHAZADO"
- Item removed from `/api/pending-knowledge`
- Item does NOT appear in `/api/knowledge`

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "test: verify telegram bot integration working"
```

---

## Summary

| Task | Deliverable | Estimated Time |
|------|-------------|----------------|
| 1 | Dependencies installed, env vars configured | 2 min |
| 2 | Telegram bot module with callbacks | 10 min |
| 3 | Bot integrated into server startup | 5 min |
| 4 | Admin management API routes | 5 min |
| 5 | Manual testing and verification | 10 min |

**Total:** ~32 minutes

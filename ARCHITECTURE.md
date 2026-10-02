# ARCHITECTURE.md

Documentación técnica de la arquitectura del proyecto **Roguelike BBTAN**.

---

## 📐 Arquitectura General

El proyecto está estructurado como una **aplicación web vanilla JS** (sin frameworks) con una clara **separación de concerns**:

```
HTML (estructura)
  ↓
CSS (estilos)
  ↓
Módulos JS (lógica)
```

### Principios de Diseño

1. **Sin Frameworks**: Vanilla JS + Canvas. Facilita portar a Unity/Godot sin reescribir la lógica.
2. **Config centralizada**: Todos los números de balance en `config.js`.
3. **IIFE modules**: Cada sistema es un módulo autoejecutado (`window.NAMESPACE = {...}`) para evitar contaminación global.
4. **Persistencia agnóstica**: `persistence.js` abstrae el almacenamiento (actualmente `localStorage`, escalable a servidor).

---

## 📦 Módulos Principales

### 1. `config.js` - Centro de Balance

**Responsabilidad**: Almacenar TODOS los números de balance del juego.

**Contenido**:
- Parámetros de combate (velocidad, tamaño bloques, dimensiones)
- Estructura de niveles y nodos
- Rareza y costo de habilidades
- Pools de trinkets, efectos elementales, nombres de skills
- Funciones de dificultad escalante (`difficultyForTurn()`, `getNodeReward()`)

**Regla de oro**: Si necesitas cambiar un número, busca primero en `config.js`. Si no está ahí, debería estarlo.

```javascript
// Ejemplo de uso en otros módulos
const CFG = window.GAME_CONFIG;
const speed = CFG.BALL_SPEED;
const difficulty = CFG.difficultyForTurn(state.turn);
```

---

### 2. `game.js` - Motor de Combate

**Responsabilidad**: Lógica de un nodo de combate individual.

**Estructura**:
```
init()                    // Inicializar estado del combate
  ↓
update(dt)               // Actualizar física y estado
  ↓
draw()                   // Renderizar en Canvas
  ↓
resolveBallBlockCollision() // Colisiones bola-bloque
advanceTurn()            // Descender filas de bloques
endGame(won)             // Fin del combate
```

**Estado local** (`state`):
```javascript
{
  turn,              // número de turno actual
  essence,           // esencia acumulada en este combate
  ballCount,         // bolas disponibles
  paddleX,           // posición horizontal de la paleta
  rows: [[]],        // filas de bloques (2D array)
  balls: [],         // bolas en vuelo
  firing,            // ¿se está disparando?
  aiming,            // ¿jugador está apuntando?
  aimDX, aimDY,      // dirección de apuntado
  gameOver,
  won
}
```

**Integración con otros módulos**:
- Lee config de `CFG` (window.GAME_CONFIG)
- Aplica efectos de skills con `FUSION.drawElementalBall()`
- Guarda resultados en run de `PERSISTENCE`

---

### 3. `map.js` - Sistema de Mapa

**Responsabilidad**: Generar y gestionar el mapa procedimental de nodos.

**Estructura**:
```
generateMap()           // Crear mapa con nodos de 3 niveles
findNodeType()          // Determinar tipo de nodo (combate, tienda, etc.)
getConnectedNodes()     // Nodos accesibles desde uno actual
canAccessNode()         // Validar si un nodo está desbloqueado
goToNode(nodeId)        // Entrar a un nodo (lanza combate o tienda)
returnToMap()           // Volver al mapa tras un combate
```

**Estructura de datos de nodo**:
```javascript
{
  id,                // "level-1-node-0"
  level,             // 1-3
  type,              // 'combat', 'elite', 'treasure', 'shop', 'event', 'boss'
  state,             // 'pending', 'won', 'lost'
  reward: {          // lo que gana el jugador
    gold,
    essence,
    skillPoints
  }
}
```

---

### 4. `persistence.js` - Guardado de Datos

**Responsabilidad**: Guardar y recuperar estado de runs y meta-progreso.

**Métodos principales**:
```javascript
PERSISTENCE.startNewRun()        // Crear run nueva
PERSISTENCE.getCurrentRun()      // Obtener run en progreso
PERSISTENCE.saveCurrentRun(run)  // Guardar cambios
PERSISTENCE.endRun(run, result)  // Finalizar run y calcular recompensas
PERSISTENCE.getMetaProgress()    // Obtener meta-progreso desbloqueado
PERSISTENCE.addMetaProgress()    // Agregar shards y desbloqueos
```

**Datos persistidos**:
- **Runs en progreso**: estado actual, nodo actual, progresión
- **Runs completadas**: historial con timestamps y estadísticas
- **Meta-progreso**: polvo de shard, habilidades desbloqueadas en meta

---

### 5. `shop.js` - Sistema de Tienda

**Responsabilidad**: Generar y gestionar la tienda de nodos-tienda.

**Métodos**:
```javascript
SHOP.generateShop(runState)     // Crear 4-6 items aleatorios
SHOP.buyItem(itemId, runState)  // Comprar y restar oro
SHOP.getItemInfo(item)          // Descripción para UI
```

**Tipos de items**:
- **Skill Points**: costo variable, desbloquea árbol de habilidades
- **Trinkets**: objetos pasivos con efectos pequeños

---

### 6. `skills.js` - Árbol de Habilidades

**Responsabilidad**: Generar, desbloquear y aplicar habilidades pasivas.

**Métodos**:
```javascript
SKILLS.generateSkillTree()      // Crear 3 ramas × 3 niveles
SKILLS.unlockSkill(skillId)     // Desbloquear con skill points
SKILLS.applyAllEffects(state)   // Aplicar bonificaciones a estado del combate
SKILLS.renderSkillTree(element) // Mostrar UI interactivo (Fase 3)
```

**Estructura de skill**:
```javascript
{
  id,           // "skill-1-2-3"
  name,
  rarity,       // 'common', 'rare', 'epic', 'legendary'
  cost,         // puntos de skill requeridos
  effect,       // { type: 'ballSpeed', value: 1.1 }
  unlocked,
  requiredLevel // prerequisito (nivel anterior desbloqueado)
}
```

---

### 7. `fusion.js` - Sistema de Elementos

**Responsabilidad**: Gestionar elementos de bolas, fusión y efectos.

**Métodos**:
```javascript
FUSION.createElementalBall()    // Crear bola con elemento
FUSION.fuse(ball1, ball2)       // Combinar dos bolas
FUSION.resolveBallBlockCollisionWithElement() // Aplicar daño con elemento
FUSION.drawElementalBall()      // Renderizar bola con símbolo
FUSION.ELEMENTS                 // Datos de 5 elementos (Fuego, Eléctrico, etc.)
```

**Elementos**:
| Elemento | Color | Efecto | Daño |
|----------|-------|--------|------|
| Fuego 🔥 | Rojo | Quema (AOE) | 1.5x |
| Eléctrico ⚡ | Amarillo | Encadena | 1.2x |
| Hielo ❄️ | Azul | Ralentiza | 1.3x |
| Naturaleza 🌿 | Verde | Sana | 1.1x |
| Vacío ◾ | Púrpura | Atraviesa | 2.0x |

---

## 🔄 Flujo de Datos entre Módulos

### Inicio de Run
```
MAP.generateMap()
  → PERSISTENCE.startNewRun()
    → crea objeto run con id, nivel, nodos
    → SKILLS.init(run) inicializa árbol
```

### Entrada a Combate
```
MAP.goToNode(nodeId)
  → GAME.init()
    → crea state de combate
    → SKILLS.applyAllEffects(state)
      → modifica state.ballCount, state.essenceMultiplier, etc.
    → renderiza canvas
```

### Fin de Combate
```
GAME.endGame(won)
  → PERSISTENCE.saveCurrentRun(state)
    → actualiza nodeStates, essence, gold, skillPoints
  → MAP.returnToMap()
    → recalcula nodos accesibles
    → renderiza mapa con nuevo estado
```

### Compra en Tienda
```
SHOP.buyItem(itemId)
  → si es skill point: run.skillPoints += 1
  → PERSISTENCE.saveCurrentRun(run)
  → SHOP.generateShop() (regenera items no comprados)
```

---

## 🎨 Renderizado (Canvas vs DOM)

### Canvas (game.js)
- **Bloques**: formas redondeadas con color por tier de HP
- **Bolas**: círculos con símbolo de elemento (emoji)
- **Paleta**: rectángulo redondeado
- **Línea de peligro**: línea punteada roja

### DOM (index.html + style.css)
- **Mapa**: lienzo SVG o Canvas pequeño, clics en nodos
- **Tienda**: grid de cards con imagen, nombre, precio
- **HUD**: información de run (oro, turno, esencia)
- **Árbol de habilidades**: grid responsivo de skills (Fase 3)

---

## 📱 Responsividad

**Diseño mobile-first**:
- Canvas escala con `getBoundingClientRect()` + `devicePixelRatio`
- Máximo ancho: 520px (para jugar cómodamente con una mano)
- Eventos táctiles con `pointer{Down,Move,Up}`
- Margen de tap expandido (áreas de colisión más grandes que visuales)

**Breakpoints CSS**:
```css
/* Por defecto: móvil (300px - 520px) */
@media (min-width: 768px) {
  /* Tablet */
}
@media (min-width: 1024px) {
  /* Desktop — puede mostrar UI adicional lateral */
}
```

---

## 🔐 Persistencia

### localStorage (Implementación Actual)
```javascript
// Guardado automático cada vez que state cambia
localStorage.setItem('roguelike_run_' + run.id, JSON.stringify(run));
localStorage.setItem('roguelike_meta', JSON.stringify(metaProgress));
```

### Backend (Implementación Futura)
```javascript
// Reemplazar en persistence.js
async function saveCurrentRun(run) {
  const response = await fetch('/api/runs/' + run.id, {
    method: 'PUT',
    body: JSON.stringify(run)
  });
  return response.json();
}
```

---

## 🎯 Puntos de Extensión (Próximas Fases)

### Fase 3: Polish
1. **Pantalla de árbol interactivo**: `SKILLS.renderSkillTree()` ya está lista
2. **Habilidades activas**: Crear `active-skills.js` con cooldowns
3. **Efectos visuales**: Crear `effects.js` con partículas

### Fase 4: Escalado
1. **Backend**: Migrar `persistence.js` a llamadas HTTP
2. **Multijugador**: Sincronizar estado en tiempo real
3. **Porting**: Traducir lógica de `game.js` a Unity/Godot

---

## 🛠️ Variables Globales Compartidas

**Window Namespace** (evitar collisiones):
```javascript
window.GAME_CONFIG = {...}      // config.js
window.COMBAT = {...}           // game.js
window.MAP = {...}              // map.js
window.PERSISTENCE = {...}      // persistence.js
window.SHOP = {...}             // shop.js
window.SKILLS = {...}           // skills.js
window.FUSION = {...}           // fusion.js
```

---

## 📊 Tamaño Aproximado del Código

```
config.js       ~300 líneas
game.js         ~600 líneas
map.js          ~500 líneas
shop.js         ~400 líneas
skills.js       ~400 líneas
fusion.js       ~400 líneas
persistence.js  ~350 líneas
index.html      ~200 líneas
style.css       ~300 líneas
─────────────────────────
Total:          ~3,450 líneas
```

---

## 🚀 Performance Targets

- **FPS**: 60 en combate (Canvas)
- **Tiempo de carga**: <1s (todo es client-side)
- **Tamaño bundle**: <500KB (sin gzip)
- **Memoria**: <50MB durante una run

**Optimizaciones implementadas**:
- Drawcall batching en Canvas (dibujar bloques en loop, no uno por uno)
- Evitar creación de objetos en `update()` (reusar arrays)
- Lazy-loading de mapa (no renderizar nodos lejanos)

---

## 🔍 Debugging

**Consola del navegador**:
```javascript
// Ver estado actual
window.COMBAT.state
window.MAP.currentRun
window.PERSISTENCE.getCurrentRun()

// Trucos
window.COMBAT.state.essence = 999
window.COMBAT.state.ballCount = 10
```

**DevTools de navegador**:
- Chrome: F12 → Perfomance → grabar combate
- Firefox: Shift+F5 → Performance → analizar FPS

---

## 📚 Referencias

- **GDD**: Ver `GDD_Roguelike_BBTAN.md` para diseño conceptual
- **README**: Ver `README.md` para guía de jugador
- **CHANGELOG**: Ver `CHANGELOG.md` para historial de cambios

---

**Última actualización**: 2026-09-06
**Versión de arquitectura**: 1.0

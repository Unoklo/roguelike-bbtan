# 🎮 Roguelike BBTAN - Juego Completo

Implementación **HTML5/Canvas/Vanilla JS** de un roguelike tipo **Breakout** con sistema de progresión, tienda, árbol de habilidades y fusión de bolas elementales.

## 🎯 Estado del Proyecto

### ✅ Fase 1: MAPA DE NODOS (Completado)
- ✅ Estructura de 3 niveles (10, 15, 20 nodos obligatorios)
- ✅ Nodos-tienda intercalados aleatoriamente (15% probabilidad)
- ✅ Sistema de progresión por nodo (desbloqueo secuencial)
- ✅ Persistencia en `localStorage`
- ✅ Interfaz visual del mapa con estados (pendiente/ganado/perdido/tienda)
- ✅ Transición fluida entre mapa y combate

### ✅ Fase 2: SISTEMAS DE PROGRESIÓN (Completado)
- ✅ **Tienda Mística**: Comprar skill points y trinkets con oro
- ✅ **Árbol de Habilidades**: 3 ramas con 3 niveles cada una, rarezas escaladas
- ✅ **Fusión de Bolas**: 5 elementos (Fuego, Eléctrico, Hielo, Naturaleza, Vacío)
- ✅ **Efectos Elementales**: Burn, Chain, Slow, Pierce
- ✅ **Sistema de Vida por Revivir**: Revivir viendo anuncio (placeholder)

### ⏳ Fase 3: POLISH & FEATURES AVANZADAS (Próximo)
- ⏳ Pantalla de árbol de habilidades interactivo
- ⏳ Habilidades activas con cooldowns
- ⏳ Efectos visuales (partículas, animaciones)
- ⏳ Sonido y música
- ⏳ Estadísticas finales de run
- ⏳ Balance y ajuste de dificultad

---

## 📁 Estructura de Archivos

```
roguelike-bbtan/
├── index.html          → Estructura HTML con 3 pantallas (mapa, combate, tienda)
├── style.css           → Estilos unificados (responsive, temas, componentes)
├── config.js           → TODOS los números de balance (editar aquí para rebalancear)
├── persistence.js      → Sistema de guardado en localStorage
├── map.js              → Lógica del mapa de nodos (Fase 1)
├── game.js             → Mecánica de combate (refactorizado)
├── shop.js             → Sistema de tienda mística (Fase 1)
├── skills.js           → Árbol de habilidades pasivas (Fase 2)
├── fusion.js           → Sistema de fusión y elementos (Fase 2)
└── README.md           → Este archivo
```

---

## 🎮 Cómo Jugar

### 1. **Comenzar una Run**
Abre `index.html` en cualquier navegador (escritorio o móvil). Se genera automáticamente una nueva run con:
- **Nivel 1**: 10 nodos obligatorios
- **Nivel 2**: 15 nodos obligatorios
- **Nivel 3**: 20 nodos obligatorios
- **~15% de nodos-tienda** intercalados

### 2. **Navegar el Mapa**
- Tap/click en un nodo desbloqueado para entrar
- Los nodos se desbloquean secuencialmente (debes ganar el anterior)
- **Verde (✓)** = Nodo ganado
- **Rojo (✗)** = Nodo perdido
- **Naranja ($)** = Tienda

### 3. **Combate**
- **Arrastra** desde la paleta inferior para apuntar
- **Suelta** para disparar el enjambre de bolas
- Las bolas tienen **elementos aleatorios** (colores diferentes)
- **Destruye bloques** para ganar esencia y oro
- **Sobrevive 12 turnos** para ganar el nodo
- Si un bloque llega a la paleta → **Derrota** (puedes revivir viendo anuncio)

### 4. **Tienda**
- Aparece cada ~6-7 nodos
- Compra con **oro ganado** en combates
- **Skill Points** (30 oro): desbloquea habilidades del árbol
- **Trinkets** (50 oro): objetos pasivos que dan bonificaciones

### 5. **Árbol de Habilidades**
- Cada rama (Ofensa, Defensa, Esencia) tiene 3 niveles
- Desbloquea con skill points (costo: 1-3 puntos según rareza)
- Habilidades aumentan bolas, velocidad, esencia, oro, salud, etc.

---

## ⚙️ Sistema de Balance (config.js)

Todos los números de balance están en **`config.js`**. Edita aquí para:

### Combate
```javascript
TURNS_TO_SURVIVE: 12,        // turnos para ganar un nodo
BALL_SPEED: 480,             // px/seg
BLOCK_H: 34,                 // altura de bloque
PADDLE_WIDTH: 52,            // ancho de la paleta
```

### Estructura de Nodos
```javascript
LEVELS: [
  { name: 'Level 1', nodeCount: 10, difficulty: 1 },
  { name: 'Level 2', nodeCount: 15, difficulty: 2 },
  { name: 'Level 3', nodeCount: 20, difficulty: 3 }
],
SHOP_NODE_CHANCE: 0.15,      // 15% de probabilidad de tienda
```

### Recompensas por Nodo
```javascript
getNodeReward(nodeIndex, level) {
  const baseGold = 50 + (nodeIndex * 10) + (level * 30);
  const skillPoints = 1;
  return { gold: baseGold, skillPoints };
}
```

### Habilidades y Trinkets
```javascript
SKILL_RARITIES: {
  common: { costSkillPoints: 1, chance: 0.50 },
  rare: { costSkillPoints: 1, chance: 0.30 },
  epic: { costSkillPoints: 2, chance: 0.15 },
  legendary: { costSkillPoints: 3, chance: 0.05 }
}
```

---

## 🔥 Elementos de Fusión (fusion.js)

Las bolas tienen 5 elementos con efectos únicos:

| Elemento | Color | Símbolo | Multiplier | Efecto |
|----------|-------|---------|-----------|--------|
| **Fuego** | Rojo | 🔥 | 1.5x | Quema bloques cercanos |
| **Eléctrico** | Amarillo | ⚡ | 1.2x | Salta a 2 bloques próximos |
| **Hielo** | Azul | ❄️ | 1.3x | Ralentiza (futuro) |
| **Naturaleza** | Verde | 🌿 | 1.1x | Efecto de sana (raro) |
| **Vacío** | Púrpura | ◾ | 2.0x | Ignora defensa |

### Fusión
Cuando dos bolas del **mismo elemento** colisionan:
- **Fusion level +1** (máximo 3)
- **Tamaño aumenta**
- **Daño aumenta** (+1 por nivel de fusión)

---

## 💾 Sistema de Persistencia

Datos guardados en `localStorage`:

```javascript
run = {
  id,                      // ID único de la run
  level,                   // Nivel actual (1-3)
  currentNodeIndex,        // Índice del nodo actual
  gold,                    // Oro acumulado
  essence,                 // Esencia total
  skillPoints,             // Puntos de skill disponibles
  ballCount,               // Bolas actuales
  activeTrinkets: [],      // Trinkets equipados
  unlockedSkills: [],      // Habilidades desbloqueadas
  nodeStates: {},          // Estado de cada nodo { nodeId: 'won'|'lost'|'pending' }
  totalNodesCompleted,     // Contador de nodos ganados
  lives: 1                 // Sistema de vidas (para revivir)
}
```

---

## 🎨 Diseño Visual

### Paleta de Colores
```css
--bg-deep: #12111a           /* Fondo principal (oscuro) */
--line-danger: #e5484d        /* Línea de peligro (rojo) */
--ball-core: #f5a94e          /* Bolas y botones primarios (naranja) */
--text-main: #ece8f2          /* Texto principal (claro) */
--text-dim: #8b87a0           /* Texto secundario (gris) */
--accent-essence: #7fd992     /* Esencia (verde) */
```

### Responsivo
- Optimizado para pantallas de 300px - 1080px
- Touch-friendly (áreas de tap expandidas)
- Escalado de UI en pantallas pequeñas

---

## 🚀 Cómo Continuar el Desarrollo

### Próxima Fase: Pantalla de Árbol de Habilidades
1. Crear nueva pantalla HTML: `#skills-screen`
2. Usar `window.SKILLS.renderSkillTree(container)` para mostrar el árbol
3. Acceder desde el mapa (botón "Árbol de Habilidades")
4. Los efectos ya se aplican automáticamente con `SKILLS.applyAllEffects()`

### Integración de Anuncios
Reemplaza en `game.js` la función `reviveFromAd()`:
```javascript
reviveFromAd() {
  // Ejemplo con Google Ads
  if (typeof google !== 'undefined' && google.ima) {
    // Cargar anuncio
  }
}
```

### Agregar Habilidades Activas (con Cooldowns)
1. Crear `active-skills.js`
2. Definir 2-3 habilidades activas por rama
3. Agregar UI de botones con barra de cooldown visual
4. Integrar con `game.js` en `update()`

### Efectos Visuales
Agregar `effects.js`:
- Partículas de explosión al destruir bloques
- Flash/tint de pantalla en eventos importantes
- Animaciones suaves de transición

---

## 🐛 Debugging & Consola

Prueba esto en la consola del navegador:

```javascript
// Ver run actual
PERSISTENCE.getCurrentRun()

// Ver árbol de habilidades
SKILLS.skillTree

// Ver nodos del mapa
MAP.nodes

// Ganar rápidamente un nodo (testing)
COMBAT.endGame(true)

// Ver historial de runs
PERSISTENCE.getRunsHistory()
```

---

## 📊 Estadísticas de una Run

Al terminar una run, se guarda:
```javascript
{
  id,
  startedAt,
  finishedAt,
  result: 'completed' | 'gameover',
  finalStats: {
    totalGold: 1500,
    totalEssence: 450,
    nodesCleared: 28,
    skillPointsUsed: 5
  }
}
```

---

## 🎯 Roadmap

### Corto Plazo (1-2 semanas)
- [ ] Pantalla de árbol de habilidades
- [ ] Integración de elementos en combate (usar `FUSION`)
- [ ] Efectos visuales básicos (partículas)

### Mediano Plazo (2-4 semanas)
- [ ] Habilidades activas con cooldowns
- [ ] Sistema de enemigos jefe (cada 3 nodos)
- [ ] Integración de anuncios reales
- [ ] Sonido y música

### Largo Plazo (1+ mes)
- [ ] Porting a Unity/Godot
- [ ] Publicación en App Stores
- [ ] Multijugador local
- [ ] Meta-progreso entre runs

---

## 📝 Licencia

Proyecto Open Source. Siéntete libre de usar y modificar.

---

## 🤝 Contribuir

Para continuar el desarrollo:

1. **Clonar el repo**
   ```bash
   git clone https://github.com/Unoklo/roguelike-bbtan
   ```

2. **Crear rama para nueva feature**
   ```bash
   git checkout -b feature/nombre-feature
   ```

3. **Editar `config.js` para balance**
   ```javascript
   // NO edites game.js/map.js directamente para números
   // Todo va en config.js
   ```

4. **Push y PR**

---

## 📞 Preguntas Frecuentes

**P: ¿Cómo cambio la dificultad?**
R: Edita `config.js` → `TURNS_TO_SURVIVE`, `difficultyForTurn()`, `getNodeReward()`

**P: ¿Cómo agrego más elementos?**
R: Edita `fusion.js` → `ELEMENTS` y agrega en `SKILL_POOL`

**P: ¿Cómo guardo datos en servidor?**
R: Modifica `persistence.js` para usar `fetch()` en lugar de `localStorage`

**P: ¿Funciona en móvil?**
R: Sí, toca y arrastra igual que en desktop. Optimizado para pantalla táctil.

---

**Última actualización:** 2026-09-06
**Versión:** 1.0.0 (Fases 1 & 2 Completas)

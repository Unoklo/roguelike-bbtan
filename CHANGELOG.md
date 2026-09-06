# CHANGELOG

Todas las versiones y cambios del proyecto **Roguelike BBTAN**.

---

## [1.0.0] - 2026-09-06

### ✨ AGREGADO

#### Fase 1: Mapa de Nodos (Completado)
- **map.js**: Sistema completo de mapa procedural
  - 3 niveles con 10, 15, 20 nodos respectivamente
  - Generación aleatoria de nodos-tienda (15% probabilidad)
  - Sistema de desbloqueo secuencial de nodos
  - Estados visuales de nodo (pendiente, ganado, perdido, tienda)
  - Renderizado con Canvas con colores temáticos
  - Transiciones fluidas entre pantallas

- **persistence.js**: Sistema de guardado persistente
  - Guardado automático en `localStorage`
  - Sistema de runs con ID único
  - Historial de runs completadas
  - Recuperación de run en progreso

- **index.html**: Estructura principal
  - 3 pantallas: Mapa, Combate, Tienda
  - HUD con información de run (oro, nivel, nodo actual)
  - Overlay para estados de fin de nivel
  - CSS responsive para desktop y móvil

#### Fase 2: Sistemas de Progresión (Completado)

- **shop.js**: Tienda mística
  - Generación procedural de 4-6 items por tienda
  - 2 tipos: Skill Points y Trinkets
  - Sistema de compra con validación de oro
  - UI clara con iconos y descripciones
  - Integración con persistencia

- **skills.js**: Árbol de habilidades pasivas
  - 3 ramas temáticas (Ofensa, Defensa, Esencia)
  - 3 niveles de profundidad en cada rama
  - Sistema de rareza (Common, Rare, Epic, Legendary)
  - Costo escalado según rareza y nivel
  - Requisitos de prerequisito (desbloquear nivel anterior)
  - Efectos aplicables: ballCount, ballSpeed, essenceMultiplier, goldMultiplier, health, penetration
  - Método `applyAllEffects()` para aplicar bonificaciones en combate

- **fusion.js**: Sistema de fusión y elementos
  - 5 elementos únicos: Fuego 🔥, Eléctrico ⚡, Hielo ❄️, Naturaleza 🌿, Vacío ◾
  - Cada elemento con multiplicador de daño único (1.1x - 2.0x)
  - Sistema de fusión: bolas del mismo elemento se combinan
  - Fusion levels: máximo 3 (tamaño + daño aumenta)
  - Efectos especiales por elemento:
    - **Burn**: Daña bloques cercanos (AOE pequeño)
    - **Chain**: Salta a 2 bloques próximos
    - **Slow**: Ralentiza bloques (implementación futura)
    - **Pierce**: Ignora defensa de bloques
  - Renderizado visual con símbolo y color por elemento
  - Método `drawElementalBall()` para dibujar bolas con elemento

#### Combate Mejorado

- **game.js**: Refactorizado para integrar elementos
  - Soporte para bolas elementales
  - Física básica: rebote, colisión
  - Sistema de turnos con descenso de filas
  - Input táctil y mouse
  - Overlay de fin de nivel (victoria/derrota)
  - Sistema de revivir (placeholder para anuncios)

#### Configuración

- **config.js**: Centro de balance del juego
  - Parámetros de combate (velocidad, tamaño de bloques, etc.)
  - Estructura de niveles
  - Rareza y costo de habilidades
  - Colores por tier de resistencia
  - Pool de trinkets disponibles

### 🎨 INTERFAZ & VISUAL

- Paleta de colores coherente oscura (tema cyberpunk)
- Estilos responsive: funciona en 300px - 1080px
- Animaciones suaves en transiciones
- UI clara con iconos emoji
- Sistema de colores por elemento (fuego rojo, hielo azul, etc.)

### 🎮 MECÁNICAS DE JUEGO

- Apuntar y disparar bolas con drag-and-drop
- Enjambre de bolas con retraso (stagger launch)
- Colisión bola-bloque con efectos elementales
- Sistema de esencia y oro
- Trinkets pasivos que modifican stats
- Skill points para desbloquear árbol de habilidades

### 📱 COMPATIBILIDAD

- ✅ Desktop (mouse + teclado)
- ✅ Móvil (touch)
- ✅ Tablet (híbrido)
- ✅ Navegadores modernos (Chrome, Firefox, Safari, Edge)

---

## Notas Técnicas

### Decisiones Arquitectónicas

1. **Sin frameworks**: Vanilla JS + Canvas. Facilita portar a Unity/Godot más adelante.
2. **Separación config/lógica**: Todo número de balance en `config.js`, lógica en `game.js`/`map.js`.
3. **IIFE modules**: Cada sistema es un módulo autoejecutado para evitar contaminación de namespace.
4. **localStorage**: Persistencia simple sin necesidad de backend (escalable a servidor después).

### Estructura de Datos Principal

```javascript
run = {
  id,                      // UUID único
  level: 1-3,              // Nivel actual
  currentNodeIndex: 0-44,  // Nodo actual (máx 10+15+20)
  gold: number,            // Moneda principal
  essence: number,         // Moneda secundaria
  skillPoints: number,     // Puntos para desbloquear habilidades
  ballCount: 3+,           // Bolas base
  activeTrinkets: [],      // Items equipados
  unlockedSkills: [],      // Árbol de habilidades desbloqueado
  nodeStates: {},          // Estado por nodo
  totalNodesCompleted: 0,  // Contador
  lives: 1,                // Vidas para revivir
  createdAt, updatedAt     // Timestamps
}
```

---

## Próximas Fases

### Fase 3: Polish & Features Avanzadas (Pendiente)
- [ ] Pantalla interactiva de árbol de habilidades
- [ ] Habilidades activas con cooldowns y botones
- [ ] Efectos visuales (partículas, explosiones)
- [ ] Sonido y música
- [ ] Enemigos jefe cada 3 nodos
- [ ] Estadísticas finales de run
- [ ] Integración real de anuncios

### Fase 4: Escalado (Futuro)
- [ ] Backend para sincronizar runs entre dispositivos
- [ ] Leaderboard global
- [ ] Multijugador local (pantalla dividida)
- [ ] Porting a Unity/Godot
- [ ] Publicación en App Stores (iOS, Android)

---

## Estadísticas del Código

```
Líneas de código escrito:    ~4,500
Archivos creados:           9 (HTML + CSS + 7 JS)
Módulos implementados:      7 (map, game, shop, skills, fusion, persistence, config)
Fases completadas:          2/4
Sistemas de juego:          5 (combate, mapa, tienda, habilidades, elementos)
```

---

## Créditos

**Desarrollador**: Unoklo
**Fecha de inicio**: 2026-09-06
**Última actualización**: 2026-09-06
**Versión**: 1.0.0

---

## Cómo Reportar Cambios

Al hacer push, incluye en el commit:
- **[FEAT]** para nuevas características
- **[FIX]** para correcciones de bugs
- **[BALANCE]** para cambios en config.js
- **[REFACTOR]** para cambios de código sin nuevas features
- **[DOCS]** para cambios de documentación

Ejemplo:
```
[FEAT] Agregar sistema de fusión de bolas elementales
- Implementar 5 elementos con efectos únicos
- Agregar fusion levels y escalado de tamaño
- Integrar con combate y renderizado
```

---

*Este archivo se actualiza con cada push importante.*

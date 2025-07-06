# 🎨 Guía de Pinceles Avanzados - Canvas Editor

Esta guía detalla los diferentes tipos de pinceles disponibles en el editor de canvas, implementados con técnicas avanzadas de HTML5 Canvas basadas en recursos como [Exploring Canvas Drawing Techniques](http://perfectionkills.com/exploring-canvas-drawing-techniques/).

## 🖌️ Tipos de Pincel Disponibles

### 1. **Pincel Tradicional** (`brush`)
- **Técnica**: Interpolación suave con `lineTo()` y `stroke()`
- **Características**: 
  - Trazos uniformes y suaves
  - Transparencia ajustable (90%)
  - Puntas redondeadas (`lineCap: 'round'`)
- **Uso ideal**: Dibujo general, bocetos, arte tradicional

### 2. **Borrador** (`eraser`)
- **Técnica**: `globalCompositeOperation = 'destination-out'`
- **Características**:
  - Elimina píxeles del canvas
  - Tamaño 1.5x más grande que el pincel normal
  - Funciona por sustracción, no por adición
- **Uso ideal**: Correcciones, efectos de luz, texturas negativas

### 3. **Carboncillo** (`carboncillo`)
- **Técnica**: Patrones aleatorios con `globalCompositeOperation = 'multiply'`
- **Características**:
  - Múltiples puntos dispersos aleatoriamente
  - Densidad proporcional al tamaño del pincel
  - Transparencia variable (10-30%)
  - Efecto granulado realista
- **Uso ideal**: Bocetos artísticos, sombras, texturas orgánicas

### 4. **Acuarela** (`acuarela`)
- **Técnica**: Gradientes radiales multicapa con variación de color
- **Características**:
  - 4 capas con diferentes niveles de transparencia
  - Gradientes radiales que simulan sangrado
  - Gotas aleatorias con variación de color ±20 RGB
  - Efecto de dispersión natural
- **Uso ideal**: Paisajes, efectos suaves, arte abstracto

### 5. **Tiza** (`tiza`)
- **Técnica**: `globalCompositeOperation = 'lighter'` con puntos granulados
- **Características**:
  - Textura rugosa simulada
  - Múltiples puntos pequeños con transparencia baja
  - Efecto de acumulación por superposición
  - Dispersión controlada
- **Uso ideal**: Pizarrón, efectos mate, texturas ásperas

### 6. **Marcador** (`marcador`)
- **Técnica**: `globalCompositeOperation = 'multiply'` con trazos uniformes
- **Características**:
  - Puntas cuadradas (`lineCap: 'square'`)
  - Transparencia fija (70%)
  - Trazos uniformes y saturados
  - Tamaño 1.5x el pincel base
- **Uso ideal**: Ilustraciones, cómics, diseño gráfico

### 7. **Óleo** (`oleo`)
- **Técnica**: Interpolación con variaciones de tamaño y textura pastosa
- **Características**:
  - Variación de tamaño por punto (80-120%)
  - Transparencia variable (30-60%)
  - Puntos de textura adicionales
  - Efecto de empaste
- **Uso ideal**: Pinturas realistas, retratos, arte clásico

### 8. **Pixel Art** (`pixel`)
- **Técnica**: Cuadrícula fija con `fillRect()` alineado
- **Características**:
  - Alineación perfecta a cuadrícula
  - Tamaño de píxel basado en el tamaño del pincel
  - Sin suavizado (anti-aliasing)
  - Patrones geométricos precisos
- **Uso ideal**: Arte retro, iconos, juegos 8-bit

### 9. **Neón** (`neon`)
- **Técnica**: `globalCompositeOperation = 'lighter'` con múltiples capas brillantes
- **Características**:
  - 3 capas de brillo (exterior, medio, núcleo)
  - `shadowBlur` progresivo (4x, 2x, 1x)
  - Transparencias decrecientes (20%, 40%, 80%)
  - Efecto de luminiscencia
- **Uso ideal**: Arte digital, efectos cyberpunk, señalética

### 10. **Puntillismo** (`puntos`)
- **Técnica**: Puntos circulares distribuidos radialmente
- **Características**:
  - Distribución en patrón circular
  - Tamaños variables (1-4px)
  - Transparencia aleatoria (60-100%)
  - Densidad proporcional al tamaño del pincel
- **Uso ideal**: Estilo impresionista, texturas pointillistas

### 11. **Grabado** (`lineas`)
- **Técnica**: Líneas cruzadas con ángulos aleatorios
- **Características**:
  - Líneas finas (30% del tamaño del pincel)
  - Ángulos completamente aleatorios
  - Longitudes variables (50-150% del tamaño)
  - Transparencia uniforme (60%)
- **Uso ideal**: Técnicas de grabado, sombreado crosshatch

### 12. **Fuego** (`fuego`)
- **Técnica**: `globalCompositeOperation = 'lighter'` con gradientes dinámicos
- **Características**:
  - 3 capas de llama con gradientes verticales
  - Paleta de colores de fuego predefinida
  - Chispas dispersas aleatorias
  - Gradientes radiales que simulan calor
- **Uso ideal**: Efectos de fuego, explosiones, energía

## 🎯 Técnicas Avanzadas Implementadas

### **Composite Operations**
- `source-over`: Dibujo normal (brush, carboncillo, óleo)
- `destination-out`: Eliminación de píxeles (eraser)
- `multiply`: Oscurecimiento (carboncillo, marcador)
- `lighter`: Adición de luz (tiza, neón, fuego)

### **Gradientes Dinámicos**
- **Radiales**: Para efectos de acuarela y fuego
- **Verticales**: Para simulación de llamas
- **Con transparencia variable**: Para sangrado natural

### **Variación Procedural**
- **Color**: ±20 RGB para acuarela
- **Tamaño**: ±40% para óleo y carboncillo
- **Posición**: Dispersión controlada para texturas
- **Transparencia**: Aleatoria para efectos naturales

### **Patrones de Textura**
- **Granulado**: Puntos aleatorios (carboncillo, tiza)
- **Geométrico**: Cuadrículas (pixel art)
- **Orgánico**: Distribución natural (acuarela, fuego)

## 💡 Consejos de Uso

1. **Layering**: Combina diferentes pinceles para efectos complejos
2. **Tamaño**: Ajusta el tamaño según el nivel de detalle deseado
3. **Transparencia**: Los pinceles con transparencia natural permiten superposición
4. **Color**: Algunos pinceles (fuego) tienen paletas integradas
5. **Textura**: Usa carboncillo y tiza para texturas de fondo

## 🔧 Configuración del Cursor

Cada pincel tiene un cursor personalizado que refleja sus características:

- **Eraser**: Gris con borde sólido
- **Neon**: Resplandor y escala 120%
- **Pixel**: Bordes cuadrados con patrón
- **Marcador**: Bordes cuadrados
- **Fuego**: Resplandor naranja
- **Acuarela**: Gradiente suave con transparencia
- **Otros**: Transparencia del color seleccionado

Esta implementación proporciona una experiencia de dibujo rica y variada, donde cada pincel tiene características únicas que lo hacen perfecto para diferentes estilos artísticos.
- **Efecto**: Elimina contenido del canvas
- **Características**: Tamaño variable, cursor visual
- **Mejor para**: Correcciones, efectos de luz

### ⚫ **Carboncillo** (carboncillo)
- **Efecto**: Textura granulada y orgánica
- **Características**: Múltiples trazos aleatorios, opacidad baja
- **Mejor para**: Sombreado, efectos dramáticos

### 💧 **Acuarela** (acuarela)
- **Efecto**: Transparencias y sangrado
- **Características**: Trazo principal difuso + gotas aleatorias
- **Mejor para**: Paisajes, efectos suaves

### 📏 **Tiza** (tiza)
- **Efecto**: Textura granular mate
- **Características**: Múltiples puntos de color, opacidad variable
- **Mejor para**: Efectos de pizarra, texturas rugosas

### 🖊️ **Marcador** (marcador)
- **Efecto**: Trazo uniforme y consistente
- **Características**: Puntas cuadradas, opacidad media
- **Mejor para**: Líneas definidas, ilustraciones

### 🎨 **Óleo** (oleo)
- **Efecto**: Textura densa con impasto
- **Características**: Grosor variable, puntos de textura
- **Mejor para**: Pinturas realistas, efectos de empaste

### 🔲 **Pixel** (pixel)
- **Efecto**: Arte pixelado retro
- **Características**: Cuadrados perfectos, efecto 8-bit
- **Mejor para**: Arte digital, sprites

### ⚡ **Neón** (neon)
- **Efecto**: Brillo intenso con múltiples capas
- **Características**: Modo de mezcla "lighter", sombras brillantes
- **Mejor para**: Efectos futuristas, arte cyberpunk

### 🔘 **Puntos** (puntos)
- **Efecto**: Patrón de puntos aleatorios
- **Características**: Círculos de diferentes tamaños
- **Mejor para**: Texturas, efectos impressionistas

### 📐 **Líneas** (lineas)
- **Efecto**: Patrón de líneas cruzadas
- **Características**: Líneas finas en ángulos aleatorios
- **Mejor para**: Sombreado técnico, texturas

### 🔥 **Fuego** (fuego)
- **Efecto**: Llamas y chispas
- **Características**: Colores cálidos aleatorios, partículas
- **Mejor para**: Efectos de fuego, arte fantástico

## 💡 Consejos de Uso

1. **Combina pinceles** para efectos únicos
2. **Ajusta el tamaño** según el detalle deseado
3. **Usa capas** dibujando con diferentes opacidades
4. **Experimenta con colores** - cada pincel reacciona diferente
5. **El cursor muestra** el tamaño y tipo de pincel seleccionado

## 🎯 Técnicas Recomendadas

- **Base**: Marcador o pincel para contornos
- **Sombreado**: Carboncillo o tiza
- **Detalles**: Pincel pequeño
- **Efectos**: Neón, fuego, puntos
- **Texturas**: Óleo, acuarela, pixel

¡Experimenta y crea arte increíble! 🚀

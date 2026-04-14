# Guía de Defensa — Riesgo Materno (Lógica Difusa + AG)

## ESTADO: Completadas P1-P15 + preguntas intermedias. Pendiente P16 en adelante.

---

## PREGUNTAS PENDIENTES POR BLOQUE

### BLOQUE 1: Variables y Funciones de Pertenencia ✅ COMPLETO
- [x] P1 — Variables de entrada → `variables.py:4` lista `VARIABLES_ENTRADA`
- [x] P2 — Tipo de función → trapezoidal, `fuzz.trapmf()`, `motor.py:197`
- [x] P3 — Universo de discurso → `limites` en `variables.py`, edad=[10,70], `np.linspace` en `motor.py:182`
- [x] P4 — Categorías `presion_sistolica` → normal/elevada/alta, `variables.py:50`
- [x] P5 — `[a,b,c,d]` → soporte=[a,d], núcleo=[b,c], grado=1 en núcleo
- [x] P6 — Grado de pertenencia → `interp_membership` `motor.py:51`, fórmula trapecio en `ripper.py:30`

### BLOQUE 2: Motor de Inferencia Mamdani ✅ COMPLETO
- [x] P7 — Mamdani 3 pasos: fusificación → evaluación reglas → desfusificación
- [x] P8 — Fusificación → `motor.py:44`, loop variables × categorías, `interp_membership`
- [x] P9 — AND = mínimo → `motor.py:65`, `np.minimum` acumulativo
- [x] P10 — OR = máximo → `motor.py:68`, `np.maximum` conserva fuerza más alta
- [x] P11 — Desfusificación → `motor.py:157`, recorta con `fmin`, agrega con `fmax`, centroide con `defuzz`
- [x] P12 — `puntaje_a_riesgo()` `motor.py:207` → <40 low, <65 mid, ≥65 high
- [x] P13 — Si nada activa → devuelve `puntaje_neutro=50.0` `motor.py:165`

### BLOQUE 3: Reglas — RIPPER ⬅ AQUÍ QUEDAMOS
- [x] P14 — Reglas aprendidas por RIPPER → `reglas.py:20`, fallback a manuales
- [x] P15 — RIPPER: aprende IF-THEN, binario × 3 clases, crece y poda reglas
- [ ] **P16 — `_discretizar()` → cómo convierte datos a categorías** ← SIGUIENTE
- [ ] P17 — ¿Dónde se guarda el JSON de reglas?
- [ ] P18 — Ejemplo de regla en JSON

### BLOQUE 4: AG — Cromosoma
- [ ] P19 — ¿Qué representa un cromosoma?
- [ ] P20 — ¿Cuántos genes tiene?
- [ ] P21 — `decodificar_cromosoma()` → qué devuelve
- [ ] P22 — ¿Por qué existe `reparar_cromosoma()`?
- [ ] P23 — Restricciones de reparación

### BLOQUE 5: AG — Fitness
- [ ] P24 — Fórmula del fitness → `algoritmo_genetico.py:179`
- [ ] P25 — ¿Qué es macro F1?
- [ ] P26 — ¿Qué es recall_alto? ¿Por qué peso propio?
- [ ] P27 — Penalizaciones interpretabilidad y desviación
- [ ] P28 — Pesos del fitness

### BLOQUE 6: AG — Operadores y Parámetros
- [ ] P29 — Inicialización de población (perturbados + aleatorios)
- [ ] P30 — Cruce aritmético
- [ ] P31 — Mutación gaussiana
- [ ] P32 — Selección por torneo
- [ ] P33 — Elitismo
- [ ] P34 — Paciencia / parada temprana
- [ ] P35 — Parámetros: 50 individuos, 60 generaciones

### BLOQUE 7: Entrenamiento y Flujo
- [ ] P36 — AG optimiza en validación, no en train
- [ ] P37 — Split: 70% train / 15% val / 15% test
- [ ] P38 — `dividir_datos_estratificados()` → por qué estratificado
- [ ] P39 — ¿Qué guarda `modelo_optimizado.json`?
- [ ] P40 — Membresias base vs optimizadas

### BLOQUE 8: Preguntas "Muéstreme"
- [ ] P41 — ¿Dónde se llama al sistema difuso en predicción?
- [ ] P42 — ¿Dónde el AG mejora las funciones de pertenencia?
- [ ] P43 — ¿Cómo una regla activa una salida paso a paso?
- [ ] P44 — Parámetros del AG desde frontend → ¿qué archivo los recibe?
- [ ] P45 — ¿Por qué AG optimiza entradas y no las reglas?

---

## RESPUESTAS CLAVE YA ESTUDIADAS

### P1 — Variables de entrada
- Archivo: `logica_difusa/variables.py:4`
- 6 variables: edad, presion_sistolica, presion_diastolica, azucar_sangre, temperatura_corporal, frecuencia_cardiaca
- Salida: `puntaje_riesgo` (0-100) con categorías bajo/medio/alto

### P2 — Función trapezoidal
- `fuzz.trapmf(universo, [a,b,c,d])` en `motor.py:197`
- `[a,b,c,d]`: a=inicio soporte, b=inicio núcleo, c=fin núcleo, d=fin soporte
- Núcleo = zona plana donde grado = 1.0
- Por qué trapezoidal: captura rangos clínicos, no un punto exacto

### Por qué esos valores en la salida [0,0,25,42], [35,45,58,70], [62,75,100,100]
- La salida NO viene del dataset (CSV tiene etiquetas, no números)
- Diseño manual — AG NO optimiza la salida, solo las entradas
- Solapamiento intencional para transiciones suaves
- Consistente con umbrales `puntaje_a_riesgo()`: <40 low, <65 mid, ≥65 high

### trapmf — cómo funciona
- universo = valores X (300 o 401 puntos igualmente espaciados)
- curva = valores Y (grados de pertenencia, mismo tamaño que universo)
- trapmf(universo, [a,b,c,d]) → array de grados, uno por cada punto del universo
- Para valor real de paciente: `interp_membership(universo, curva, v)` → interpolación lineal

### interp_membership — fusificación
- `motor.py:51` (lote) y `motor.py:110` (con explicación)
- universo=X, curva=Y, v=valor del paciente → devuelve 1 grado
- Interpola entre las dos marcas más cercanas

### 300 vs 401 puntos
- Entrada 300 (`PUNTOS_GRAFICA`): suficiente para interpolación
- Salida 401 (`PUNTOS_SALIDA`): integra todo el array para centroide

### Motor Mamdani — evaluación de reglas
- `act_bajo/medio/alto = np.zeros(n)` → acumuladores por paciente, arrancan en 0
- `fuerza = np.ones(n)` → reinicia en 1 para cada regla (neutro para AND)
- `np.minimum` acumulativo → AND difuso (eslabón más débil)
- `np.maximum(mapa_act[consecuente], fuerza, out=...)` → OR difuso, conserva fuerza máxima
- `mapa_act` = diccionario para acceso rápido sin if/elif

### Desfusificación centroide
- `np.fmin(activacion, curva_salida)` → recorta trapecio al nivel de activación
- `np.fmax(salida_agregada, salida_recortada)` → une áreas, gana Y más alto
- `fuzz.defuzz(universo_salida, salida_agregada, "centroid")` → Σ(X·Y)/Σ(Y)
- Discreto: 401 puntos, no integral continua

### RIPPER — aprendizaje de reglas
- Binario: se entrena 3 veces (high risk vs resto, mid vs resto, low vs resto)
- `ripper.py:63` — usa librería `wittgenstein`
- Crece regla agregando condiciones, luego poda con fórmula `(p-n)/(p+n)`
- Poda: quita condición si nuevo valor >= valor actual
- Si regla muy específica y quitar cualquier condición baja el valor → se queda completa
- Condiciones = categorías lingüísticas (edad=adulta, presion=alta)
- Necesita datos categóricos → por eso primero discretiza

### _discretizar() — preparación para RIPPER
- Convierte números a categorías usando `_grado_trapecio()`
- Para cada valor calcula grado en TODOS los trapecios de esa variable
- Gana la categoría con mayor grado
- Ejemplo: edad=36 → joven=0.0, adulta=0.5, avanzada=0.33 → "adulta"

---

## ARCHIVOS CLAVE

| Archivo | Qué contiene |
|---|---|
| `logica_difusa/variables.py` | Variables, límites, categorías, puntos de trapecios |
| `logica_difusa/reglas.py` | Carga reglas desde JSON (aprendidas o manuales) |
| `logica_difusa/motor.py` | Motor Mamdani: fusificación → reglas → desfusificación |
| `optimizacion/cromosoma.py` | Codificación/decodificación/reparación del cromosoma |
| `optimizacion/algoritmo_genetico.py` | AG: fitness, operadores, ejecución |
| `optimizacion/penalizaciones.py` | Penalizaciones de fitness |
| `entrenamiento/entrenador.py` | Orquesta todo: datos → AG → guardar modelo |
| `entrenamiento/ripper.py` | Aprende reglas desde datos con RIPPER |
| `entrenamiento/modelo.py` | Parámetros AG, pesos fitness, rutas de archivos |
| `modelos/modelo_optimizado.json` | Cromosoma optimizado guardado en disco |
| `modelos/reglas_aprendidas.json` | Reglas aprendidas por RIPPER |

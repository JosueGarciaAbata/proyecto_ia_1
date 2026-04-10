# Documentacion completa de `riesgo_materno_difuso`

## 1. Objetivo de este documento

Este documento explica el proyecto `riesgo_materno_difuso` desde cero y usando el codigo real del repositorio. La idea es que puedas:

- entender que hace cada modulo;
- entender que hace cada funcion importante;
- explicar el flujo completo del sistema a otra persona;
- distinguir que parte corresponde a logica difusa y que parte corresponde a optimizacion;
- saber que entra, que sale y por que el sistema responde como responde.

No se asume conocimiento previo del proyecto.

---

## 2. Que problema resuelve este proyecto

El proyecto construye un clasificador de riesgo materno basado en un sistema difuso tipo Mamdani.

Las entradas del sistema son:

1. `edad`
2. `presion_sistolica`
3. `presion_diastolica`
4. `azucar_sangre`
5. `temperatura_corporal`
6. `frecuencia_cardiaca`

La salida final es una etiqueta de riesgo:

- `low risk`
- `mid risk`
- `high risk`

Internamente, el sistema no clasifica directamente con reglas rigidas. En cambio:

1. convierte cada valor numerico en grados de pertenencia difusos;
2. aplica reglas de conocimiento experto;
3. genera una salida difusa agregada;
4. la convierte a un puntaje numerico;
5. transforma ese puntaje en una etiqueta final.

Ademas, el proyecto incluye un algoritmo genetico que no cambia las reglas, pero si ajusta las funciones de pertenencia de entrada para intentar mejorar el rendimiento del sistema.

---

## 3. Estructura general del proyecto

La parte central esta en:

- `riesgo_materno_difuso/logica_difusa/`
- `riesgo_materno_difuso/optimizacion/`
- `riesgo_materno_difuso/sistema_difuso/`

Tambien hay scripts en la raiz:

- `predecir_cli.py`
- `optimizar_mamdani_ag.py`
- `pruebas.py`

La separacion conceptual es esta:

### 3.1 Logica difusa

Aqui vive el motor Mamdani y las reglas del sistema.

### 3.2 Optimizacion

Aqui vive el algoritmo genetico, la codificacion del cromosoma, la reparacion de soluciones y las penalizaciones.

### 3.3 Sistema difuso

Aqui viven las configuraciones, carga de datos, entrenamiento, evaluacion, metricas y prediccion.

---

## 4. Flujo completo del sistema

El flujo completo del proyecto se puede resumir asi:

1. Se carga el CSV original.
2. Se renombran columnas y se validan etiquetas.
3. Se limpian registros anormales puntuales.
4. Se divide el dataset en entrenamiento, validacion y prueba.
5. Se construye un sistema difuso base.
6. Se evalua el sistema base.
7. Se ejecuta un algoritmo genetico sobre el split de validacion.
8. El mejor cromosoma define nuevas funciones de pertenencia de entrada.
9. Se construye el sistema difuso optimizado.
10. Se comparan metricas base vs optimizado.
11. Se guarda el mejor cromosoma en `modelo_optimizado.json`.
12. La CLI reutiliza ese modelo para predecir sin reentrenar cada vez.

---

## 5. Dataset y variables del problema

La ruta del dataset esta en `riesgo_materno_difuso/sistema_difuso/configuracion.py`:

- `RUTA_CSV = "Maternal Health Risk Data Set.csv"`

La columna objetivo del CSV es:

- `RiskLevel`

El mapa entre nombres internos y nombres del CSV es:

| Nombre interno | Columna CSV |
|---|---|
| `edad` | `Age` |
| `presion_sistolica` | `SystolicBP` |
| `presion_diastolica` | `DiastolicBP` |
| `azucar_sangre` | `BS` |
| `temperatura_corporal` | `BodyTemp` |
| `frecuencia_cardiaca` | `HeartRate` |

Las etiquetas validas del problema son:

- `low risk`
- `mid risk`
- `high risk`

### 5.1 Limpieza aplicada al dataset

La funcion `quitar_registros_con_frecuencia_cardiaca_erronea()` elimina filas donde `frecuencia_cardiaca == 7`.

El comentario del codigo explica por que:

- el dataset original contiene 2 filas con frecuencia cardiaca igual a 7;
- ese valor se considera erroneo para este dominio;
- esas filas no deben participar en entrenamiento ni optimizacion.

Despues de esa limpieza, el dataset queda en:

- `1012` filas limpias

Distribucion observada:

- `404` casos `low risk`
- `336` casos `mid risk`
- `272` casos `high risk`

### 5.2 Division del dataset

Las proporciones se definen en `PROPORCIONES_SPLIT`:

- entrenamiento: `0.70`
- validacion: `0.15`
- prueba: `0.15`

La division es estratificada.

En una ejecucion reciente del proyecto, el tamanio fue:

- entrenamiento: `708`
- validacion: `152`
- prueba: `152`

Importante:

- el codigo usa `train_test_split(..., shuffle=True)` pero no fija `random_state`;
- eso significa que los splits y las metricas pueden variar entre ejecuciones.

---

## 6. Conceptos basicos de logica difusa usados aqui

### 6.1 Universo de una variable

Cada variable trabaja dentro de un rango definido. Por ejemplo:

- `edad`: de `10.0` a `70.0`
- `azucar_sangre`: de `6.0` a `19.0`
- `temperatura_corporal`: de `97.0` a `103.0`

Ese rango se llama universo.

### 6.2 Funcion de pertenencia trapezoidal

Cada categoria difusa se representa con 4 puntos:

- `a`
- `b`
- `c`
- `d`

Interpretacion:

- antes de `a`, pertenencia `0`;
- entre `a` y `b`, la pertenencia sube;
- entre `b` y `c`, la pertenencia es alta;
- entre `c` y `d`, la pertenencia baja;
- despues de `d`, la pertenencia vuelve a `0`.

En el codigo, esas funciones se construyen con `skfuzzy.fuzz.trapmf(...)`.

### 6.3 Fusificacion

Fusificar significa tomar un numero real y calcular cuanto pertenece a cada categoria.

Ejemplo conceptual:

- una edad de 35 anios puede pertenecer parcialmente a `adulta` y parcialmente a `avanzada`.

### 6.4 Reglas difusas

Las reglas tienen forma:

`SI antecedente1 Y antecedente2 ... ENTONCES riesgo = categoria`

En este proyecto:

- el operador `AND` se implementa con minimo;
- la agregacion entre reglas del mismo consecuente se implementa con maximo.

### 6.5 Desfusificacion

La salida difusa final se convierte a un numero usando centroide.

Eso produce un puntaje continuo entre `0` y `100`.

Luego ese puntaje se traduce a etiqueta:

- menor que `40.0` -> `low risk`
- menor que `65.0` -> `mid risk`
- caso contrario -> `high risk`

---

## 7. Configuracion central del sistema

Archivo:

- `riesgo_materno_difuso/sistema_difuso/configuracion.py`

Este archivo define casi toda la estructura del sistema.

### 7.1 `SALIDA_DIFUSA`

Define la variable difusa de salida:

- nombre: `puntaje_riesgo`
- universo: `0.0` a `100.0`

Categorias de salida:

- `bajo`: `[0.0, 0.0, 25.0, 42.0]`
- `medio`: `[35.0, 45.0, 58.0, 70.0]`
- `alto`: `[62.0, 75.0, 100.0, 100.0]`

### 7.2 `ESPECIFICACIONES_VARIABLES`

Define, para cada variable:

- limites validos;
- epsilon de reparacion;
- tolerancia para saturacion;
- categorias difusas base.

#### Edad

- limites: `10.0` a `70.0`
- epsilon: `0.5`
- tolerancia: `2.0`
- categorias:
  - `joven`: `[10.0, 10.0, 20.0, 28.0]`
  - `adulta`: `[24.0, 28.0, 34.0, 38.0]`
  - `avanzada`: `[34.0, 40.0, 70.0, 70.0]`

#### Presion sistolica

- limites: `70.0` a `160.0`
- epsilon: `1.0`
- tolerancia: `5.0`
- categorias:
  - `normal`: `[70.0, 70.0, 110.0, 125.0]`
  - `elevada`: `[120.0, 128.0, 138.0, 145.0]`
  - `alta`: `[140.0, 148.0, 160.0, 160.0]`

#### Presion diastolica

- limites: `49.0` a `100.0`
- epsilon: `1.0`
- tolerancia: `5.0`
- categorias:
  - `normal`: `[49.0, 49.0, 70.0, 80.0]`
  - `elevada`: `[76.0, 82.0, 90.0, 95.0]`
  - `alta`: `[90.0, 95.0, 100.0, 100.0]`

#### Azucar en sangre

- limites: `6.0` a `19.0`
- epsilon: `0.1`
- tolerancia: `0.5`
- categorias:
  - `normal`: `[6.0, 6.0, 7.5, 8.5]`
  - `elevada`: `[8.0, 9.0, 12.0, 14.0]`
  - `alta`: `[12.0, 14.0, 19.0, 19.0]`

#### Temperatura corporal

- limites: `97.0` a `103.0`
- epsilon: `0.1`
- tolerancia: `0.5`
- categorias:
  - `normal`: `[97.0, 97.0, 98.5, 99.5]`
  - `elevada`: `[99.0, 100.0, 101.0, 101.5]`
  - `fiebre`: `[101.0, 101.5, 103.0, 103.0]`

#### Frecuencia cardiaca

- limites: `60.0` a `90.0`
- epsilon: `1.0`
- tolerancia: `5.0`
- categorias:
  - `normal`: `[60.0, 60.0, 72.0, 80.0]`
  - `elevada`: `[76.0, 82.0, 90.0, 90.0]`

### 7.3 Parametros del AG

`PARAMETROS_AG` define:

- `tamano_poblacion = 50`
- `cantidad_hijos = 50`
- `maximo_generaciones = 60`
- `probabilidad_cruce = 0.85`
- `probabilidad_mutacion = 0.04`
- `elitismo = 3`
- `tamano_torneo = 3`
- `paciencia = 20`

### 7.4 Pesos de fitness

`PESOS_FITNESS`:

- `macro_f1 = 0.65`
- `recall_alto = 0.35`
- `interpretabilidad = 0.15`
- `desviacion = 0.10`

Eso significa que el sistema valora principalmente:

1. buena calidad global;
2. buena deteccion de `high risk`;
3. sin perder interpretabilidad;
4. sin alejarse demasiado del sistema base.

---

## 8. Reglas del sistema difuso

Archivo:

- `riesgo_materno_difuso/logica_difusa/reglas.py`

El sistema usa 15 reglas fijas. El algoritmo genetico no las cambia.

### 8.1 Reglas de bajo riesgo

Regla 1:

- `azucar_sangre normal`
- `presion_sistolica normal`
- `presion_diastolica normal`
- consecuente `bajo`

Regla 2:

- `azucar_sangre normal`
- `presion_diastolica normal`
- `temperatura_corporal normal`
- consecuente `bajo`

### 8.2 Reglas de riesgo medio

Regla 3:

- `azucar_sangre elevada`
- `presion_diastolica normal`
- consecuente `medio`

Regla 4:

- `presion_sistolica elevada`
- `azucar_sangre normal`
- consecuente `medio`

Regla 5:

- `presion_diastolica elevada`
- `azucar_sangre normal`
- consecuente `medio`

Regla 6:

- `edad avanzada`
- `azucar_sangre normal`
- `presion_diastolica normal`
- consecuente `medio`

Regla 7:

- `temperatura_corporal elevada`
- consecuente `medio`

### 8.3 Reglas de alto riesgo

Regla 8:

- `azucar_sangre alta`
- consecuente `alto`

Regla 9:

- `azucar_sangre elevada`
- `presion_diastolica elevada`
- consecuente `alto`

Regla 10:

- `azucar_sangre elevada`
- `presion_sistolica elevada`
- consecuente `alto`

Regla 11:

- `azucar_sangre elevada`
- `edad avanzada`
- consecuente `alto`

Regla 12:

- `presion_diastolica alta`
- consecuente `alto`

Regla 13:

- `presion_sistolica alta`
- consecuente `alto`

Regla 14:

- `temperatura_corporal fiebre`
- consecuente `alto`

Regla 15:

- `edad avanzada`
- `presion_diastolica elevada`
- consecuente `alto`

### 8.4 Que optimiza y que no optimiza el proyecto

El proyecto optimiza:

- la forma y posicion de las funciones de pertenencia de entrada.

El proyecto no optimiza:

- las reglas;
- las categorias semanticas;
- las categorias de salida;
- los umbrales finales de `puntaje_a_riesgo()`.

---

## 9. Motor de inferencia difusa

Archivo:

- `riesgo_materno_difuso/logica_difusa/motor.py`

Clase principal:

- `SistemaDifusoMamdani`

Funcion auxiliar:

- `puntaje_a_riesgo(puntaje)`

### 9.1 `SistemaDifusoMamdani.__init__(self, membresias_entrada)`

Recibe las funciones de pertenencia de entrada.

Hace esto:

1. guarda `membresias_entrada`;
2. define `puntaje_neutro = 50.0`;
3. crea universos de entrada;
4. crea universo de salida;
5. construye curvas trapezoidales;
6. compila reglas para evaluacion rapida.

### 9.2 `inferir_lote(self, entradas)`

Es la funcion central del motor.

Pasos:

#### Paso 1: fusificacion

Para cada variable y categoria calcula grados de pertenencia con `fuzz.interp_membership(...)`.

#### Paso 2: evaluacion de reglas

Para cada regla:

- aplica `minimo` entre antecedentes;
- acumula por consecuente con `maximo`.

Se mantienen tres arreglos:

- `act_bajo`
- `act_medio`
- `act_alto`

#### Paso 3: desfusificacion

Para cada caso:

1. recorta cada curva de salida;
2. agrega todas las salidas;
3. si todo es cero, devuelve `50.0`;
4. si no, aplica centroide.

Luego transforma los puntajes a etiquetas con `puntaje_a_riesgo()`.

Devuelve:

```python
{
    "puntajes": ...,
    "riesgos": ...,
    "activaciones": ...
}
```

### 9.3 `_desfusificar(self, activaciones)`

Agrega las salidas recortadas y calcula el centroide. Si no hay activacion devuelve `50.0`.

### 9.4 `_compilar_reglas(self)`

Convierte `REGLAS` a una lista mas rapida de evaluar.

### 9.5 `_crear_universos_entrada(self)`

Construye los universos de cada variable con `np.linspace(...)`.

### 9.6 `_crear_universo_salida(self)`

Construye el universo de salida.

### 9.7 `_crear_curvas_entrada(self)`

Convierte los puntos `[a, b, c, d]` en curvas trapezoidales reales.

### 9.8 `_crear_curvas_salida(self)`

Hace lo mismo para `bajo`, `medio` y `alto`.

### 9.9 `puntaje_a_riesgo(puntaje)`

Convierte el puntaje continuo a etiqueta:

- `NaN` -> `None`
- `< 40.0` -> `low risk`
- `< 65.0` -> `mid risk`
- resto -> `high risk`

---

## 10. Codificacion del cromosoma y membresias base

Archivo:

- `riesgo_materno_difuso/optimizacion/cromosoma.py`

Cada solucion del AG es un vector numerico que contiene todos los puntos `[a, b, c, d]` de todas las categorias de entrada.

### 10.1 Longitud del cromosoma

Cantidad de categorias:

- edad: 3
- presion_sistolica: 3
- presion_diastolica: 3
- azucar_sangre: 3
- temperatura_corporal: 3
- frecuencia_cardiaca: 2

Total:

- `17` categorias

Cada categoria aporta 4 genes:

- `17 * 4 = 68`

Por eso el cromosoma tiene `68` genes.

### 10.2 `reparar_cromosoma(cromosoma)`

Divide el cromosoma por bloques de variable, repara cada bloque y devuelve:

- cromosoma reparado
- bandera `es_valido`

### 10.3 `reparar_bloque_variable(...)`

Corrige todos los trapecios de una variable:

1. recorta al rango;
2. ordena;
3. repara cada trapecio;
4. ordena categorias por centro;
5. ajusta categorias vecinas;
6. valida el bloque final.

### 10.4 `validar_bloque_variable(...)`

Comprueba:

- ausencia de `NaN`;
- valores dentro del rango;
- orden interno del trapecio;
- soporte positivo;
- orden de centros;
- ausencia de huecos fuertes;
- ausencia de solapamiento excesivo.

### 10.5 `ajustar_categorias_adyacentes(...)`

Busca que las categorias vecinas tengan una forma razonable corrigiendo:

- huecos;
- exceso de solapamiento;
- cruce indebido de zonas centrales.

### 10.6 `ordenar_categorias_por_centro(bloque)`

Ordena categorias usando el centro `(b + c) / 2`.

### 10.7 `reparar_trapecio(...)`

Garantiza que un trapecio sea usable:

- ordena puntos;
- recorta al dominio;
- fuerza soporte minimo;
- asegura `a <= b <= c <= d`.

### 10.8 `centro_de_trapecio(trapecio)`

Devuelve `(b + c) / 2`.

### 10.9 `ancho_de_soporte(trapecio)`

Devuelve `d - a`.

### 10.10 `crear_tabla_de_membresias(membresias)`

Convierte membresias a filas legibles con variable, categoria y puntos.

### 10.11 `decodificar_cromosoma(cromosoma)`

Reconstruye un `OrderedDict` de membresias a partir del vector.

### 10.12 `aplanar_membresias(membresias)`

Convierte membresias a:

1. genes;
2. limites inferiores;
3. limites superiores;
4. rangos por gen.

### 10.13 `crear_membresias_base()`

Construye las membresias base a partir de `ESPECIFICACIONES_VARIABLES`.

### 10.14 Constantes derivadas

El modulo deja listas estas constantes:

- `MEMBRESIAS_BASE`
- `CROMOSOMA_BASE_CRUDO`
- `LIMITES_INFERIORES`
- `LIMITES_SUPERIORES`
- `RANGOS_GENES`
- `CROMOSOMA_BASE`
- `CROMOSOMA_BASE_VALIDO`

---

## 11. Penalizaciones del algoritmo genetico

Archivo:

- `riesgo_materno_difuso/optimizacion/penalizaciones.py`

El AG no solo busca clasificar bien. Tambien intenta mantener soluciones razonables.

### 11.1 `calcular_penalizacion_interpretabilidad(cromosoma)`

Analiza el cromosoma convertido a membresias y calcula 4 tipos de penalizacion:

#### a) Soporte

Penaliza categorias demasiado estrechas.

#### b) Huecos

Penaliza separaciones grandes entre categorias vecinas.

#### c) Solapamiento

Penaliza solapamiento excesivo entre categorias vecinas.

#### d) Desorden

Penaliza que los centros de las categorias no sigan un orden natural.

La funcion devuelve:

```python
{
    "soporte": ...,
    "huecos": ...,
    "solapamiento": ...,
    "desorden": ...,
    "total": ...
}
```

`total` es el promedio de las cuatro penalizaciones.

### 11.2 `calcular_penalizacion_desviacion(cromosoma, cromosoma_base, rangos_genes)`

Mide cuanto se aleja un cromosoma del cromosoma base.

Se calcula:

- diferencia absoluta por gen;
- normalizada por el rango del gen;
- promediada sobre todos los genes.

Esto ayuda a evitar soluciones extremas o muy deformadas.

---

## 12. Algoritmo genetico

Archivo:

- `riesgo_materno_difuso/optimizacion/algoritmo_genetico.py`

Aqui vive el ciclo de optimizacion.

### 12.1 `FITNESS_INVALIDO`

Valor:

- `-1000.0`

Se usa para castigar soluciones invalidas.

### 12.2 `Individuo`

Es un `@dataclass` que representa una solucion ya evaluada.

Campos:

- `cromosoma`
- `fitness`
- `macro_f1_validacion`
- `recall_alto_validacion`
- `penalizacion_interpretabilidad`
- `penalizacion_desviacion`
- `es_valido`

### 12.3 `ejecutar_algoritmo_genetico(datos_validacion)`

Es la funcion principal del AG.

Hace esto:

1. crea cache de evaluaciones;
2. inicializa historial;
3. construye poblacion inicial;
4. define la funcion fitness para `PyGAD`;
5. define callback por generacion;
6. ejecuta el AG;
7. recupera la mejor solucion;
8. devuelve:
   - mejor individuo
   - historial como `DataFrame`

Detalles importantes:

- usa `PyGAD`;
- el cache evita reevaluar cromosomas ya vistos;
- el historial guarda evolucion generacional;
- se imprime progreso por generacion.

### 12.4 Cache interno: `obtener_individuo(solucion)`

Funcion anidada dentro de `ejecutar_algoritmo_genetico()`.

Su papel:

- toma una solucion;
- crea una clave con `crear_clave_solucion(...)`;
- si ya fue evaluada, reutiliza el resultado;
- si no, la evalua.

### 12.5 `fitness_func(instancia_ga, solucion, indice_solucion)`

Devuelve simplemente `obtener_individuo(solucion).fitness`.

### 12.6 `on_generation(instancia_ga)`

Callback ejecutado al finalizar cada generacion.

Responsabilidades:

- evaluar la poblacion actual;
- encontrar el mejor individuo;
- calcular promedio de fitness;
- agregar una fila al historial;
- imprimir progreso;
- actualizar el mejor global;
- contar generaciones sin mejora;
- detener el AG si supera la paciencia.

### 12.7 `evaluar_individuo(cromosoma, datos_validacion, cromosoma_base=CROMOSOMA_BASE)`

Convierte un cromosoma en un valor de fitness.

Pasos:

1. repara el cromosoma;
2. si queda invalido, devuelve `FITNESS_INVALIDO`;
3. reconstruye las membresias;
4. crea un `SistemaDifusoMamdani`;
5. infiere el split de validacion;
6. calcula `macro_f1`;
7. calcula `recall` de `high risk`;
8. calcula penalizacion de interpretabilidad;
9. calcula penalizacion de desviacion;
10. combina todo en una sola formula.

Formula exacta:

```text
fitness =
    0.65 * macro_f1
  + 0.35 * recall_alto
  - 0.15 * penalizacion_interpretabilidad_total
  - 0.10 * penalizacion_desviacion
```

### 12.8 `inicializar_poblacion()`

Construye la poblacion inicial con:

- 1 individuo base exacto;
- aproximadamente 65 por ciento perturbados alrededor del base;
- el resto completamente aleatorios.

### 12.9 `cruce_aritmetico(padres, tamano_descendencia, instancia_ga)`

Implementa un cruce continuo:

- mezcla genes de dos padres con lambdas aleatorias entre `0.25` y `0.75`;
- genera dos hijos;
- repara ambos hijos.

### 12.10 `mutacion_gaussiana(descendencia, instancia_ga)`

Implementa mutacion continua:

- para cada hijo crea una mascara aleatoria por gen;
- agrega ruido gaussiano a los genes elegidos;
- despues repara el cromosoma.

### 12.11 `crear_clave_solucion(solucion)`

Convierte la solucion en bytes despues de redondearla a 8 decimales.

Sirve para usar la solucion como clave de cache.

---

## 13. Carga de datos y conversion de splits

Archivo:

- `riesgo_materno_difuso/sistema_difuso/datos.py`

### 13.1 `cargar_datos(ruta_csv)`

Hace toda la carga y validacion inicial del CSV.

Pasos:

1. lee el archivo con `pandas`;
2. verifica columnas requeridas;
3. convierte entradas a numerico;
4. normaliza las etiquetas de riesgo;
5. valida que todas las etiquetas existan;
6. revisa faltantes o no numericos;
7. elimina registros con frecuencia cardiaca erronea.

Devuelve un `DataFrame` limpio con nombres internos.

### 13.2 `dividir_datos_estratificados(tabla)`

Parte el dataset en 3 splits estratificados:

```python
{
    "entrenamiento": ...,
    "validacion": ...,
    "prueba": ...
}
```

### 13.3 `convertir_split_a_diccionario(tabla_split)`

Convierte un `DataFrame` de un split al formato:

```python
{
    "entradas": {
        variable: np.array(...)
    },
    "riesgos": np.array(...)
}
```

### 13.4 `resumir_splits(splits)`

Construye una tabla resumen con:

- nombre del split;
- tamanio;
- conteos por clase.

### 13.5 `validar_proporciones()`

Verifica que entrenamiento + validacion + prueba sumen 1.0.

### 13.6 `quitar_registros_con_frecuencia_cardiaca_erronea(datos)`

Aplica la limpieza puntual del dataset.

---

## 14. Evaluacion del sistema

Archivo:

- `riesgo_materno_difuso/sistema_difuso/evaluacion.py`

### 14.1 `evaluar_cromosoma_en_splits(cromosoma, datos_por_split)`

Decodifica el cromosoma y evalua sus membresias en todos los splits.

### 14.2 `evaluar_membresias_en_splits(membresias, datos_por_split)`

Construye un `SistemaDifusoMamdani` y evalua cada split.

### 14.3 `evaluar_sistema_en_split(sistema, datos_split)`

Pasos:

1. ejecuta `inferir_lote()`;
2. obtiene puntajes y riesgos;
3. valida que no haya `NaN` ni riesgos vacios;
4. calcula resumen de metricas;
5. agrega puntajes y riesgos predichos al resumen.

### 14.4 `crear_tabla_comparativa(base, optimizado)`

Construye una tabla comparando:

- MacroF1 entrenamiento
- MacroF1 validacion
- MacroF1 prueba
- Recall alto validacion
- Recall alto prueba
- Exactitud balanceada prueba

Ademas agrega:

- `delta = optimizado - base`

---

## 15. Metricas

Archivo:

- `riesgo_materno_difuso/sistema_difuso/metricas.py`

### 15.1 `crear_resumen_evaluacion(riesgos_reales, riesgos_predichos)`

Agrupa:

- macro F1
- recall de riesgo alto
- exactitud balanceada
- matriz de confusion
- reporte de clasificacion

### 15.2 `crear_reporte_clasificacion_tabla(...)`

Usa `classification_report` y lo convierte a `DataFrame`.

Incluye filas por clase y tambien:

- exactitud
- promedio macro
- promedio ponderado

### 15.3 `calcular_exactitud_balanceada(...)`

Usa `balanced_accuracy_score`.

### 15.4 `calcular_recall_de_riesgo_alto(...)`

Calcula el recall solo para la clase `high risk`.

### 15.5 `calcular_macro_f1(...)`

Calcula F1 macro.

### 15.6 `crear_matriz_confusion(...)`

Construye la matriz de confusion con el orden fijo de etiquetas.

---

## 16. Entrenamiento y persistencia del modelo

Archivo:

- `riesgo_materno_difuso/sistema_difuso/entrenamiento.py`

Este modulo orquesta el pipeline completo.

### 16.1 `obtener_resultado_entrenamiento(forzar_reentrenamiento=False)`

Es la entrada principal cuando quieres el pipeline completo.

Comportamiento:

- si `forzar_reentrenamiento=True`, limpia la cache interna y vuelve a entrenar;
- si `False`, reutiliza la cache del proceso actual si ya existe;
- en un proceso nuevo, vuelve a ejecutar el entrenamiento completo.

Importante:

- esta funcion no carga directamente `modelo_optimizado.json` para saltarse el entrenamiento;
- depende de la cache `lru_cache` del proceso.

### 16.2 `obtener_membresias_optimizadas()`

Esta si intenta reutilizar el modelo persistido en disco.

Flujo:

1. llama `cargar_modelo_optimizado()`;
2. si existe y es valido, devuelve las membresias del archivo;
3. si no, entrena desde el CSV y guarda el modelo.

Esta es la funcion que hace posible que la CLI no reentrene siempre.

### 16.3 `entrenar_y_guardar()`

Funcion mas importante del pipeline.

Pasos exactos:

1. carga los datos del CSV;
2. divide en splits;
3. convierte splits al formato de inferencia;
4. evalua el sistema base;
5. ejecuta el algoritmo genetico sobre validacion;
6. decodifica el mejor cromosoma;
7. evalua el sistema optimizado en todos los splits;
8. crea tabla comparativa;
9. arma un diccionario grande con todos los resultados;
10. guarda el modelo optimizado en JSON;
11. devuelve el resultado.

Decorador:

- `@lru_cache(maxsize=1)`

Eso significa que, dentro del mismo proceso Python, si la vuelves a pedir, no recalcula.

### 16.4 `cargar_modelo_optimizado()`

Lee `modelo_optimizado.json` si existe.

Pasos:

1. abre el JSON;
2. lee `mejor_cromosoma`;
3. lo convierte a `numpy`;
4. lo repara y valida;
5. si es usable, devuelve las membresias optimizadas reconstruidas;
6. si no, devuelve `None`.

### 16.5 `guardar_modelo_optimizado(resultado)`

Guarda en disco:

- ruta del CSV;
- mejor cromosoma;
- fitness;
- macro F1 de validacion;
- recall alto de validacion;
- numero de generaciones.

No guarda todo el historial ni los splits.

---

## 17. Prediccion de un caso nuevo

Archivo:

- `riesgo_materno_difuso/sistema_difuso/prediccion.py`

### 17.1 `predecir_caso(valores_entrada)`

Es la funcion principal para uso operativo.

Hace esto:

1. obtiene membresias optimizadas;
2. construye un `SistemaDifusoMamdani`;
3. valida y normaliza la entrada;
4. ejecuta inferencia sobre un lote de un solo caso;
5. devuelve:
   - puntaje
   - riesgo
   - descripcion del sistema
   - origen del modelo
   - ajustes aplicados

### 17.2 `construir_entrada_lote(valores_entrada)`

Convierte un diccionario de escalares a un formato de lote de longitud 1:

```python
{
    "edad": [valor],
    ...
}
```

Tambien devuelve la lista de ajustes aplicados.

### 17.3 `validar_valores_entrada(valores_entrada)`

Valida cada variable de entrada.

Para cada variable:

1. toma el valor;
2. busca el rango permitido;
3. busca la tolerancia de saturacion;
4. llama `saturar_si_esta_cerca_del_limite(...)`;
5. si el valor sigue siendo invalido, lanza error;
6. si fue ajustado, lo registra en la lista de ajustes.

### 17.4 `saturar_si_esta_cerca_del_limite(variable, valor, minimo, maximo, tolerancia)`

Implementa una regla conservadora:

- si el valor esta dentro del rango, lo acepta;
- si esta apenas por debajo o por encima, lo satura al borde;
- si esta demasiado lejos, lo rechaza.

Ejemplos:

- `frecuencia_cardiaca = 92` puede ajustarse a `90`;
- `frecuencia_cardiaca = 140` se rechaza.

---

## 18. Scripts de uso

### 18.1 `predecir_cli.py`

Este script expone la prediccion por linea de comandos.

#### `principal()`

- parsea argumentos;
- recoge valores;
- llama `predecir_caso(...)`;
- imprime resultado.

#### `recoger_valores(argumentos)`

- obtiene cada variable del parser;
- si falta, la pide por teclado.

#### `pedir_valor(nombre)`

- hace `input()` y convierte a `float`.

#### `crear_parser()`

- define todos los argumentos CLI.

Uso tipico:

```powershell
venv\Scripts\python.exe predecir_cli.py --edad 25 --presion-sistolica 130 --presion-diastolica 80 --azucar-sangre 7.2 --temperatura-corporal 98.4 --frecuencia-cardiaca 86
```

### 18.2 `optimizar_mamdani_ag.py`

Script para ejecutar el entrenamiento y ver resultados.

#### `principal()`

- fuerza reentrenamiento;
- imprime tabla comparativa;
- imprime mejor fitness;
- imprime mejor cromosoma;
- imprime historial de fitness.

### 18.3 `pruebas.py`

Es un auxiliar adicional para:

- ejecutar un solo caso;
- o ejecutar muchos casos desde CSV;
- guardar resultados en un txt.

Funciones relevantes:

#### `principal()`

Decide si se ejecuta modo individual o modo CSV.

#### `ejecutar_desde_csv(argumentos)`

- lee filas;
- normaliza datos;
- filtra por clase objetivo;
- ejecuta prediccion fila por fila;
- guarda un reporte en texto.

#### `leer_filas_csv(ruta_csv)`

Lee el CSV con `csv.DictReader`.

#### `normalizar_filas_csv(filas)`

Convierte las filas del CSV a los nombres internos y tipos numericos del proyecto.

#### `recoger_valores(argumentos)`

Recoge valores desde argumentos o desde teclado.

#### `pedir_valor(nombre)`

Pide un valor individual.

#### `construir_salida_individual(resultado)`

Formatea el resultado de un solo caso a texto.

#### `construir_comando(valores)`

Construye el comando CLI equivalente a un caso.

#### `formatear_numero(valor)`

Quita decimales innecesarios al imprimir.

#### `guardar_texto(ruta_salida, contenido)`

Escribe el reporte final.

#### `crear_parser()`

Define argumentos tanto para modo individual como masivo.

Observacion importante:

- `pruebas.py` no forma parte del paquete central de inferencia;
- es una herramienta util de prueba y trazabilidad.

---

## 19. Resultados observados en una ejecucion reciente

En una ejecucion reciente del proyecto, tras reentrenar, se observaron estos resultados:

| Metrica | Base | Optimizado | Delta |
|---|---:|---:|---:|
| MacroF1 entrenamiento | 0.504384 | 0.538885 | 0.034501 |
| MacroF1 validacion | 0.519959 | 0.608263 | 0.088305 |
| MacroF1 prueba | 0.554603 | 0.527885 | -0.026718 |
| Recall alto validacion | 0.780488 | 0.926829 | 0.146341 |
| Recall alto prueba | 0.804878 | 0.829268 | 0.024390 |
| Exactitud balanceada prueba | 0.569823 | 0.545166 | -0.024657 |

Mejor individuo reportado:

- fitness: `0.7175586354657856`
- macro F1 validacion: `0.6082634717469023`
- recall alto validacion: `0.926829268292683`
- generaciones: `60`

### 19.1 Como interpretar estos resultados

La optimizacion favorece claramente la deteccion de `high risk`, especialmente en validacion.

Sin embargo, tambien se observa algo importante:

- mejorar validacion no garantiza mejorar prueba en todas las metricas.

Eso sugiere que:

- el ajuste del AG ayuda en ciertos objetivos;
- pero no necesariamente mejora la generalizacion global en todos los criterios.

### 19.2 Importante sobre reproducibilidad

Como no hay `random_state` fijo en los splits ni semillas globales para el AG:

- estos numeros pueden cambiar en otra ejecucion.

Por eso, si expones resultados, conviene decir:

- "estos resultados corresponden a una corrida concreta del sistema".

---

## 20. Archivo `modelo_optimizado.json`

Este archivo guarda el mejor cromosoma encontrado y algunos metadatos.

No guarda reglas nuevas.

No guarda un modelo binario opaco.

Lo que guarda es suficiente para:

1. reconstruir las funciones de pertenencia optimizadas;
2. volver a instanciar el sistema difuso;
3. predecir sin reentrenar.

---

## 21. Ejemplo conceptual de una prediccion

Supongamos un caso con:

- edad = 40
- presion_sistolica = 145
- presion_diastolica = 96
- azucar_sangre = 13
- temperatura_corporal = 99.5
- frecuencia_cardiaca = 85

Lo que pasaria conceptualmente es esto:

1. `edad` tendria pertenencia importante a `avanzada`.
2. `presion_sistolica` tendria pertenencia importante a `alta`.
3. `presion_diastolica` tendria pertenencia importante a `alta`.
4. `azucar_sangre` tendria pertenencia a `elevada` y posiblemente a `alta`.
5. Se activarian reglas como:
   - azucar alta -> alto
   - presion diastolica alta -> alto
   - presion sistolica alta -> alto
   - azucar elevada y edad avanzada -> alto
6. Las salidas de `alto` dominarian la agregacion.
7. El centroide se desplazaria a la zona alta del universo de salida.
8. El puntaje final probablemente quedaria por encima de 65.
9. La clase devuelta seria `high risk`.

Este tipo de explicacion es util para exponer el proyecto porque conecta:

- datos de entrada;
- reglas activadas;
- salida final.

---

## 22. Fortalezas tecnicas del proyecto

1. Es interpretable: las reglas son legibles y las membresias tambien.
2. Separa bien responsabilidades entre modulos.
3. Usa optimizacion continua sin perder la estructura semantica.
4. Repara soluciones invalidas del AG en vez de aceptar basura.
5. Prioriza detectar casos graves mediante `recall_alto`.
6. Tiene persistencia de modelo para no reentrenar siempre.

---

## 23. Limitaciones tecnicas que debes conocer

1. El AG optimiza usando solo el split de validacion, por lo que puede sesgarse hacia ese split.
2. No hay semilla fija, asi que los resultados no son totalmente reproducibles.
3. Las reglas son fijas; si el conocimiento experto inicial es insuficiente, el AG no puede corregirlo por completo.
4. La salida final depende de umbrales discretos (`40` y `65`) definidos manualmente.
5. La clase `high risk` recibe prioridad en fitness, lo que puede afectar otras metricas.

---

## 24. Resumen por modulo

### `logica_difusa/reglas.py`

Define el conocimiento experto en forma de 15 reglas.

### `logica_difusa/motor.py`

Implementa el motor Mamdani: fusificacion, reglas, agregacion y desfusificacion.

### `optimizacion/cromosoma.py`

Define como se representa y repara una solucion del AG.

### `optimizacion/penalizaciones.py`

Calcula castigos para soluciones poco interpretables o demasiado desviadas.

### `optimizacion/algoritmo_genetico.py`

Ejecuta el proceso evolutivo y encuentra el mejor cromosoma.

### `sistema_difuso/configuracion.py`

Contiene constantes del proyecto: rutas, variables, membresias base, pesos y parametros.

### `sistema_difuso/datos.py`

Carga, valida, limpia y divide el dataset.

### `sistema_difuso/metricas.py`

Calcula metricas de clasificacion.

### `sistema_difuso/evaluacion.py`

Evalua sistemas o cromosomas en splits y crea comparativas.

### `sistema_difuso/entrenamiento.py`

Orquesta el pipeline completo y guarda el mejor modelo.

### `sistema_difuso/prediccion.py`

Usa el modelo optimizado para predecir nuevos casos.

---

## 25. Resumen final para explicarlo oralmente

Si necesitas explicarlo de forma breve ante otra persona, puedes usar esta idea:

"El proyecto construye un sistema difuso Mamdani para clasificar riesgo materno a partir de seis variables clinicas. Primero define funciones de pertenencia y reglas expertas para representar conceptos como presion alta, azucar elevada o edad avanzada. Luego, un algoritmo genetico ajusta los parametros numericos de esas funciones de pertenencia para mejorar el desempenio, especialmente en la deteccion de casos de alto riesgo. El sistema final toma valores reales, los fusifica, aplica reglas, desfusifica un puntaje entre 0 y 100 y finalmente lo convierte en una clase: low, mid o high risk. Todo el flujo esta separado en modulos de configuracion, datos, inferencia difusa, evaluacion, optimizacion y prediccion para mantener claridad e interpretabilidad."

---

## 26. Recomendacion para estudiar este codigo

Si quieres recorrerlo en el mejor orden posible, te recomiendo este:

1. `riesgo_materno_difuso/sistema_difuso/configuracion.py`
2. `riesgo_materno_difuso/logica_difusa/reglas.py`
3. `riesgo_materno_difuso/logica_difusa/motor.py`
4. `riesgo_materno_difuso/optimizacion/cromosoma.py`
5. `riesgo_materno_difuso/optimizacion/penalizaciones.py`
6. `riesgo_materno_difuso/optimizacion/algoritmo_genetico.py`
7. `riesgo_materno_difuso/sistema_difuso/datos.py`
8. `riesgo_materno_difuso/sistema_difuso/metricas.py`
9. `riesgo_materno_difuso/sistema_difuso/evaluacion.py`
10. `riesgo_materno_difuso/sistema_difuso/entrenamiento.py`
11. `riesgo_materno_difuso/sistema_difuso/prediccion.py`
12. `predecir_cli.py` y `optimizar_mamdani_ag.py`

Ese orden va de lo conceptual a lo operativo.


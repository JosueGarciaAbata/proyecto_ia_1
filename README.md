# Sistema difuso Mamdani para riesgo materno

## Que contiene este proyecto

Este proyecto se centra en tres piezas:

- un sistema difuso Mamdani para clasificar riesgo materno;
- un algoritmo genetico para optimizar las funciones de pertenencia de entrada;
- una interfaz por CLI para enviar valores y recibir la clase de riesgo.

Por ahora el proyecto ya no genera graficas ni carpetas de salida auxiliares. Solo persiste un archivo de modelo optimizado para no reentrenar en cada ejecucion.

La unica fuente de datos externa usada por el proyecto es:

- `Maternal Health Risk Data Set.csv`

## Idea general

El sistema recibe estas entradas:

- `edad`
- `presion_sistolica`
- `presion_diastolica`
- `azucar_sangre`
- `temperatura_corporal`
- `frecuencia_cardiaca`

Con esas variables:

1. el sistema difuso calcula grados de pertenencia;
2. aplica las reglas fijas;
3. desfusifica un puntaje de riesgo;
4. convierte ese puntaje en:
   - `low risk`
   - `mid risk`
   - `high risk`

El algoritmo genetico no cambia las reglas. Solo optimiza los parametros de las funciones de pertenencia de entrada.

## Como se usa cada parte

El proyecto separa dos usos:

- la `CLI` usa por defecto el sistema optimizado entrenado desde el CSV original;
- el script de optimizacion ejecuta ese mismo proceso de entrenamiento y muestra sus resultados.

Importante:

- la CLI intenta cargar un modelo optimizado persistido en disco;
- si ese modelo no existe, entrena con el CSV, lo guarda y luego predice;
- el script de optimizacion fuerza un reentrenamiento y sobrescribe el modelo persistido.

## Estructura importante

- `predecir_cli.py`: recibe valores por consola y devuelve la prediccion.
- `optimizar_mamdani_ag.py`: ejecuta el algoritmo genetico y muestra resultados en consola.
- `riesgo_materno_difuso/logica_difusa/`: motor Mamdani y reglas.
- `riesgo_materno_difuso/sistema_difuso/`: configuracion, datos, evaluacion, entrenamiento y prediccion.
- `riesgo_materno_difuso/optimizacion/`: cromosoma, reparacion, penalizaciones y algoritmo genetico.

## Donde esta cada parte clave

### Sistema difuso

- Reglas fijas: `riesgo_materno_difuso/logica_difusa/reglas.py`
- Motor Mamdani: `riesgo_materno_difuso/logica_difusa/motor.py`

El motor usa `scikit-fuzzy` para simplificar:

- membresias trapezoidales;
- fuzzificacion;
- defuzzificacion por centroide.

### Algoritmo genetico

- Ciclo principal del AG: `riesgo_materno_difuso/optimizacion/algoritmo_genetico.py`
- Cromosoma y reparacion: `riesgo_materno_difuso/optimizacion/cromosoma.py`
- Penalizaciones de fitness: `riesgo_materno_difuso/optimizacion/penalizaciones.py`

El AG usa `PyGAD` para manejar:

- seleccion;
- cruce;
- mutacion;
- ciclo generacional.

La parte propia del dominio que sigue definida por nosotros es:

- como se codifica el cromosoma;
- como se repara;
- como se calcula la fitness;
- como se construye y evalua el sistema difuso.

## Como funciona la optimizacion

Cuando se ejecuta la optimizacion, el flujo es este:

1. se carga `Maternal Health Risk Data Set.csv`;
2. se hace la particion estratificada;
3. se evalua el sistema base;
4. se ejecuta el algoritmo genetico sobre validation;
5. se toma el mejor cromosoma;
6. se reconstruyen las funciones de pertenencia optimizadas;
7. se usa ese sistema para predecir o comparar.

Todo eso ocurre en memoria.

## Dependencias

Instalacion recomendada en el entorno virtual del proyecto:

```powershell
venv\Scripts\python.exe -m pip install -r requirements.txt
```

Dependencias principales:

- `numpy`
- `pandas`
- `scikit-fuzzy`
- `pygad`
- `scikit-learn`

## Prediccion por CLI

La CLI siempre usa el sistema optimizado. Eso significa:

1. busca `modelo_optimizado.json`;
2. si existe, lo carga y predice;
3. si no existe, entrena con `Maternal Health Risk Data Set.csv`, guarda el modelo y luego predice.

```powershell
venv\Scripts\python.exe predecir_cli.py --edad 25 --presion-sistolica 130 --presion-diastolica 80 --azucar-sangre 7.2 --temperatura-corporal 98.4 --frecuencia-cardiaca 86
```

Si omites algun argumento, el programa te lo pide por teclado.

Nota importante:

- la primera ejecucion puede tardar porque entrena el modelo;
- las ejecuciones siguientes reutilizan `modelo_optimizado.json`;
- si quieres reentrenar manualmente, usa `optimizar_mamdani_ag.py`.
- en la entrada por CLI, si un valor queda apenas fuera del dominio operativo, el sistema lo satura al limite; si queda demasiado fuera, lo rechaza.

Tolerancias de saturacion en la CLI:

- `edad`: 2 unidades
- `presion_sistolica`: 5 unidades
- `presion_diastolica`: 5 unidades
- `azucar_sangre`: 0.5 unidades
- `temperatura_corporal`: 0.5 unidades
- `frecuencia_cardiaca`: 5 unidades

Ejemplos:

- si `frecuencia_cardiaca = 102`, se ajusta a `100`
- si `frecuencia_cardiaca = 140`, se rechaza
- si `edad = 76`, se ajusta a `75`
- si `edad = 120`, se rechaza

## Ejecutar solo la optimizacion

```powershell
venv\Scripts\python.exe optimizar_mamdani_ag.py
```

Ese script:

- vuelve a entrenar el sistema optimizado desde el CSV;
- sobrescribe `modelo_optimizado.json`;
- compara base vs optimizado;
- muestra la tabla de metricas;
- muestra el mejor cromosoma;
- muestra el historial de fitness.

## Aclaracion sobre "membresias base" y "membresias optimizadas"

En este proyecto:

- `membresias base` significa las funciones de pertenencia iniciales definidas directamente en el codigo;
- `membresias optimizadas` significa las funciones de pertenencia que encuentra el algoritmo genetico usando el CSV original durante la ejecucion de la optimizacion.

No son archivos externos que cambian la respuesta por fuera del sistema. Son dos conjuntos de parametros internos del mismo modelo difuso.

## Archivo persistido

El modelo optimizado se guarda en:

- `modelo_optimizado.json`

Ese archivo contiene el mejor cromosoma encontrado y algunos datos basicos de la optimizacion. La CLI lo reutiliza para evitar reentrenar en cada ejecucion.

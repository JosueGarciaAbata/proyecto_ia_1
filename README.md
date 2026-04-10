# Sistema difuso Mamdani + algoritmo genetico

## Arquitectura breve

La solucion implementa un sistema Mamdani completo con fuzzificacion trapezoidal, inferencia por reglas fijas, agregacion max-min y defuzzificacion por centroide. El algoritmo genetico usa codificacion real para optimizar solo los parametros de las funciones de pertenencia de entrada, con reparacion obligatoria y fitness calculado sobre validation.

## Pseudocodigo de alto nivel

1. Cargar `Maternal Health Risk Data Set.csv`.
2. Dividir el dataset de forma estratificada en `train=70%`, `validation=15%`, `test=15%`.
3. Construir el sistema base Mamdani con las reglas fijas.
4. Codificar todas las funciones de pertenencia de entrada en un cromosoma real.
5. Inicializar la poblacion con 1 cromosoma base, perturbados y aleatorios factibles.
6. Reparar, inferir y evaluar cada individuo sobre validation.
7. Aplicar torneo, cruce aritmetico, mutacion gaussiana y seleccion `(mu + lambda)`.
8. Detener por maximo de generaciones o por falta de mejora.
9. Evaluar una sola vez sobre test y comparar con el sistema base.

## Estructura modular

- `run_mamdani_ga.py`
- `maternal_risk_fuzzy/config.py`
- `maternal_risk_fuzzy/data.py`
- `maternal_risk_fuzzy/fuzzy_engine.py`
- `maternal_risk_fuzzy/rules.py`
- `maternal_risk_fuzzy/chromosome.py`
- `maternal_risk_fuzzy/penalties.py`
- `maternal_risk_fuzzy/ga.py`
- `maternal_risk_fuzzy/metrics.py`
- `maternal_risk_fuzzy/evaluation.py`
- `maternal_risk_fuzzy/visualization.py`

## Ejecucion

```powershell
python run_mamdani_ga.py
```

## Prediccion por CLI

Para usar el sistema como clasificador simple desde consola:

```powershell
python predict_cli.py --age 25 --systolicbp 130 --diastolicbp 80 --bs 7.2 --bodytemp 98.4 --heartrate 86
```

Si omites algun argumento, el script lo pedira por teclado.

Por defecto usa `outputs/optimized_memberships.csv` si ya existe. Si quieres forzar el sistema base:

```powershell
python predict_cli.py --system base
```

## Artefactos esperados

El script genera en `outputs/`:

- `report.txt`
- `metrics_comparison.csv`
- `fitness_history.csv`
- `fitness_curve.svg`
- `membership_comparison.csv`
- `base_memberships.csv`
- `optimized_memberships.csv`
- `best_chromosome.json`
- matrices de confusion y reportes de clasificacion
- un SVG por variable con funciones iniciales vs optimizadas

## Notas conservadoras de implementacion

- `HeartRate` incorpora `taquicardia` y `taquicardia_marcada` porque las reglas fijas los usan.
- `DiastolicBP` usa cota superior `140` para mantener factible el termino base `severa=[108,110,140,140]`.

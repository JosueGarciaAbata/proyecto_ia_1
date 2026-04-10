"""Sistema difuso para clasificacion de riesgo materno."""

from pathlib import Path
import sys


def activar_paquetes_del_venv_local():
    raiz_proyecto = Path(__file__).resolve().parent.parent
    ruta_site_packages = raiz_proyecto / "venv" / "Lib" / "site-packages"
    if ruta_site_packages.exists():
        ruta_texto = str(ruta_site_packages)
        if ruta_texto not in sys.path:
            sys.path.insert(0, ruta_texto)


activar_paquetes_del_venv_local()

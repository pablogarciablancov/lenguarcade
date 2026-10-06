# Textos sin recortes en ventanas compactas

La captura del usuario mostraba el nombre del duelista y la explicación del contrato
cortados verticalmente. Las filas fijas del tablero no respetaban la altura del
contenido tras ampliar la tipografía; el retrato también excedía la fila compacta.

Las filas del duelista y del contrato ahora se dimensionan por su contenido. El
nombre tiene interlineado suficiente y el pergamino reserva margen para sus bordes.
El atril mantiene una altura mínima; si la ventana resulta demasiado baja, solo
la mesa tiene desplazamiento interno, sin scroll general ni recortes de sus paneles.
Se actualiza la versión del CSS para que el navegador cargue la corrección.

Validación: check-versopolis y check-syntax correctos. Chromium comprueba los
límites del texto frente a sus paneles en 1366×768, 1440×900, 1920×1080, 1366×650,
1366×580 y 1100×600. También pasan las pruebas existentes de ratón, clic, táctil,
cancelación, reordenación, devolución, guardado/restauración local y puntuación.

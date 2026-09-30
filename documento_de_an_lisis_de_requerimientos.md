# Análisis de Requerimientos y Especificaciones Técnicas - Prueba Diagnóstica Backend

Este documento detalla los requerimientos, funciones principales, reglas de negocio y consideraciones críticas extraídas de la prueba diagnóstica para el desarrollo de la API REST de gestión de postulaciones.

---

## 1. Contexto y Objetivo del Proyecto
* **Tipo de Proyecto:** Desarrollo de API REST Backend desde cero.
* **Stack Tecnológico:** Node.js y Base de datos relacional SQL.
* **Objetivo General:** Gestionar postulaciones de candidatos a vacantes laborales, permitiendo registrar postulaciones, consultar su estado y calcular automáticamente una prioridad de revisión basada en reglas de negocio específicas.

---

## 2. Estructura de Datos y Base de Datos (`database.sql`)
El sistema debe modelar relacionalmente tres entidades principales:

### 2.1. Entidades y Atributos
1. **Candidato (`candidates`)**
   * Identificador (Primary Key)
   * Nombre
   * Correo electrónico
   * Años de experiencia
2. **Vacante (`vacancies`)**
   * Identificador (Primary Key)
   * Título del cargo
   * Años mínimos de experiencia requeridos
   * Estado de la vacante (`OPEN`, `CLOSED`)
3. **Postulación (`applications`)**
   * Identificador (Primary Key)
   * Candidato (`candidate_id` - Foreign Key)
   * Vacante (`vacancy_id` - Foreign Key)
   * Carta de presentación (`cover_letter`)
   * Fuente de la postulación (`source`)
   * Puntaje (`score`)
   * Prioridad (`priority`)
   * Estado (`status`)
   * Fecha de creación (`created_at`)
   * Fecha de última actualización de estado (`updated_at`)

### 2.2. Restricciones e Incialización
* El script `database.sql` debe incluir la creación de tablas, claves primarias, claves foráneas y restricciones necesarias.
* Debe incluir datos de prueba iniciales con **al menos tres candidatos** y **dos vacantes** (una de ellas obligatoriamente en estado `CLOSED`).
* No se requiere implementar endpoints para crear candidatos ni vacantes.

---

## 3. Catálogos y Valores Permitidos

* **Fuentes de postulación (`source`):**
  * `REFERRAL` (Referido por un colaborador)
  * `INTERNAL` (Colaborador actual)
  * `JOB_BOARD` (Portal de empleo)
  * `OTHER`

* **Estados de la postulación (`status`):**
  * `RECEIVED` (Estado inicial al registrarse)
  * `IN_REVIEW`
  * `REJECTED` (Estado final)
  * `HIRED` (Estado final)
  * *Nota:* Las postulaciones activas se consideran aquellas en estado `RECEIVED` o `IN_REVIEW`.

* **Estados de la vacante:**
  * `OPEN`
  * `CLOSED`

* **Niveles de Prioridad (`priority`):**
  * `LOW` (Puntaje: $0$ a $2$)
  * `MEDIUM` (Puntaje: $3$ a $4$)
  * `HIGH` (Puntaje: $5$ a $6$)
  * `TOP` (Puntaje: $7$ o más)

---

## 4. Lógica de Negocio y Reglas Críticas

### 4.1. Cálculo Automático de Puntaje y Prioridad
El puntaje y la prioridad se calculan de forma automática en el servidor al registrar una postulación. **No se aceptan estos valores desde el cliente.**

| Condición | Impacto en Puntaje |
| :--- | :--- |
| Años de experiencia del candidato $\ge$ mínimos de la vacante | $+4$ |
| Fuente es `REFERRAL` | $+3$ |
| Fuente es `INTERNAL` | $+2$ |
| Carta de presentación contiene `"node"`, `"sql"` o `"api"` (Case-insensitive; suma una sola vez aunque se repitan) | $+2$ |
| Carta de presentación tiene más de $500$ caracteres | $+1$ |
| Candidato tiene $3$ o más postulaciones activas en otras vacantes | $-2$ |

* **Restricción de Puntaje:** El puntaje total nunca puede ser negativo. Si el resultado es menor que $0$, se registra $0$.

### 4.2. Regla de Duplicidad y Restricciones de Postulación
* Un candidato **no puede** postularse a una vacante en la que ya posee una postulación activa (`RECEIVED`, `IN_REVIEW` o `HIRED`).
* Si la postulación anterior fue `REJECTED`, el candidato solo puede volver a postularse **cuando hayan transcurrido al menos 30 días** desde la fecha de rechazo.
* Si se incumple esta regla, la API debe rechazar la creación y retornar un código HTTP de error apropiado (ej. `400` o `409`).

---

## 5. Endpoints Obligatorios (Funcionalidades)

### 5.1. Registrar Postulación (`POST /applications`)
* **Validaciones previas:**
  1. Validar datos obligatorios y formato.
  2. Validar que la fuente pertenezca a los valores permitidos.
  3. Verificar existencia del candidato.
  4. Verificar existencia de la vacante y que su estado sea `OPEN`.
  5. Aplicar la regla de duplicidad (historial de 30 días o postulaciones activas).
  6. Consultar métricas e información necesaria para reglas de prioridad.
  7. Calcular puntaje y prioridad de forma determinística.
  8. Insertar en la base de datos asignando el estado inicial `RECEIVED`.
  9. Retornar respuesta HTTP coherente.

### 5.2. Consultar Postulaciones (`GET /applications`)
* **Requisitos de visualización:** Incluir datos de la postulación junto con el nombre, correo electrónico del candidato y el título de la vacante.
* **Ordenamiento:** De mayor a menor puntaje; en caso de empate, por fecha de creación ascendente (la más antigua primero).
* **Filtros opcionales mediante query params:**
  * Por estado: `GET /applications?status=IN_REVIEW`
  * Por vacante: `GET /applications?vacancyId=1`
  * Combinados: `GET /applications?status=RECEIVED&vacancyId=1`

### 5.3. Cambiar Estado de Postulación (`PUT /applications/:id/status`)
* **Validaciones:**
  1. Verificar existencia de la postulación.
  2. Validar que el nuevo estado sea permitido.
  3. **Restricción:** Una postulación en estado final (`REJECTED` o `HIRED`) **no puede** cambiar de estado.
  4. Actualizar la fecha de última modificación (`updated_at`).
  5. Responder con el código HTTP correspondiente ante errores.

---

## 6. Pruebas Automatizadas y Entregables
* **Pruebas Unitarias/Integración:** Implementar al menos tres (3) pruebas automatizadas centradas en la lógica de cálculo de puntaje y prioridad.
* **Inteligencia Artificial (`RESPUESTAS.md`):** Responder las tres preguntas teóricas sobre integración de modelos de IA, manejo de errores de formato y ética en decisiones automatizadas de prioridad.
* **Entregables del Repositorio:**
  * Código fuente completo (sin carpeta `node_modules`).
  * `package.json` y archivo de bloqueo de dependencias.
  * `database.sql`.
  * `.env.example` (sin credenciales reales).
  * `README.md` con instrucciones de instalación, configuración y pruebas de endpoints.
  * `RESPUESTAS.md`.
  * `CHAT.md` (si se utilizaron asistentes de IA).
  * Pruebas automatizadas configuradas.
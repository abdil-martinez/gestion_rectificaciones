-- ============================================================
--  CONSULTAS SQL — SISTEMA DE GESTIÓN DE RECTIFICACIONES
--  Base de datos: PostgreSQL
--  Generado para: DBeaver 25.3.5
-- ============================================================


-- ============================================================
--  SECCIÓN 1: CONSULTAS SIMPLES
-- ============================================================


-- ------------------------------------------------------------
-- 1.1  Listar todos los usuarios del sistema con su rol
-- ------------------------------------------------------------
SELECT
    id,
    username,
    first_name || ' ' || last_name AS nombre_completo,
    email,
    rol,
    is_active
FROM accounts_customuser
ORDER BY rol, username;


-- ------------------------------------------------------------
-- 1.2  Listar todas las solicitudes (vista rápida)
-- ------------------------------------------------------------
SELECT
    id,
    numero_solicitud,
    estado,
    prioridad,
    fecha_recepcion,
    fecha_limite,
    monto_total,
    created_at::date AS fecha_creacion
FROM solicitudes_solicitud
WHERE deleted_at IS NULL
ORDER BY created_at DESC;


-- ------------------------------------------------------------
-- 1.3  Contar solicitudes por estado
-- ------------------------------------------------------------
SELECT
    estado,
    COUNT(*) AS total
FROM solicitudes_solicitud
WHERE deleted_at IS NULL
GROUP BY estado
ORDER BY total DESC;


-- ------------------------------------------------------------
-- 1.4  Listar asegurados activos
-- ------------------------------------------------------------
SELECT
    id,
    cedula,
    cua,
    nombre || ' ' || COALESCE(ap_paterno, '') || ' ' || COALESCE(ap_materno, '') AS nombre_completo,
    celular,
    email
FROM solicitudes_asegurado
WHERE deleted_at IS NULL
ORDER BY nombre;


-- ------------------------------------------------------------
-- 1.5  Listar todos los catálogos de regionales con su tipo
-- ------------------------------------------------------------
SELECT
    r.id,
    r.nombre        AS regional,
    tr.nombre       AS tipo_regional
FROM catalogos_regional r
LEFT JOIN catalogos_tiporegional tr ON tr.id = r.tipo_regional_id
WHERE r.deleted_at IS NULL
ORDER BY tr.nombre, r.nombre;


-- ------------------------------------------------------------
-- 1.6  Listar formularios FPC de una solicitud específica
--      (cambiar el numero_solicitud por el que quieras)
-- ------------------------------------------------------------
SELECT
    f.id,
    f.numero        AS numero_fpc,
    f.periodo,
    tp.nombre       AS tipo_planilla,
    f.total_ganado,
    f.monto_pago,
    f.fecha_pago
FROM solicitudes_formulario f
JOIN solicitudes_solicitud s ON s.id = f.solicitud_id
LEFT JOIN catalogos_tipoplanilla tp ON tp.id = f.tipo_planilla_id
WHERE s.numero_solicitud = 'RE2026-000001'
  AND f.deleted_at IS NULL
ORDER BY f.periodo;


-- ------------------------------------------------------------
-- 1.7  Ver registros eliminados (soft delete) — todos los modelos
-- ------------------------------------------------------------
SELECT 'solicitud'  AS tabla, id, numero_solicitud AS referencia, deleted_at FROM solicitudes_solicitud  WHERE deleted_at IS NOT NULL
UNION ALL
SELECT 'asegurado'  AS tabla, id, cedula            AS referencia, deleted_at FROM solicitudes_asegurado   WHERE deleted_at IS NOT NULL
UNION ALL
SELECT 'empleador'  AS tabla, id, nombre_razon_social AS referencia, deleted_at FROM solicitudes_empleador  WHERE deleted_at IS NOT NULL
UNION ALL
SELECT 'formulario' AS tabla, id, numero             AS referencia, deleted_at FROM solicitudes_formulario  WHERE deleted_at IS NOT NULL
ORDER BY deleted_at DESC;


-- ------------------------------------------------------------
-- 1.8  Solicitudes vencidas (fecha_limite < hoy, no finalizadas)
-- ------------------------------------------------------------
SELECT
    numero_solicitud,
    estado,
    fecha_limite,
    CURRENT_DATE - fecha_limite AS dias_vencida
FROM solicitudes_solicitud
WHERE fecha_limite < CURRENT_DATE
  AND estado NOT IN ('FIN', 'ANU', 'APRO')
  AND deleted_at IS NULL
ORDER BY dias_vencida DESC;


-- ------------------------------------------------------------
-- 1.9  Contar solicitudes creadas por mes (últimos 12 meses)
-- ------------------------------------------------------------
SELECT
    TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS mes,
    COUNT(*) AS total
FROM solicitudes_solicitud
WHERE created_at >= NOW() - INTERVAL '12 months'
  AND deleted_at IS NULL
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY mes;


-- ------------------------------------------------------------
-- 1.10  Ver toda la bitácora de una solicitud
--       (cambiar el numero_solicitud)
-- ------------------------------------------------------------
SELECT
    b.created_at                    AS fecha,
    u.username                      AS usuario,
    b.estado_anterior,
    b.estado_nuevo,
    b.accion,
    b.comentario,
    b.ip_address
FROM solicitudes_bitacorasolicitud b
JOIN solicitudes_solicitud s ON s.id = b.solicitud_id
LEFT JOIN accounts_customuser u ON u.id = b.usuario_id
WHERE s.numero_solicitud = 'RE2026-000031'
ORDER BY b.created_at;


-- ============================================================
--  SECCIÓN 2: CONSULTAS COMPLEJAS
-- ============================================================


-- ------------------------------------------------------------
-- 2.1  Vista completa de solicitudes con todos sus datos relacionados
-- ------------------------------------------------------------
SELECT
    sol.numero_solicitud,
    sol.estado,
    sol.prioridad,
    sol.fecha_recepcion,
    sol.fecha_limite,
    sol.monto_total,

    -- Asegurado
    ase.cedula                      AS asegurado_cedula,
    ase.nombre || ' ' || COALESCE(ase.ap_paterno,'') AS asegurado_nombre,
    ase.cua                         AS asegurado_cua,

    -- Empleador
    emp.nombre_razon_social         AS empleador,
    emp.nit                         AS empleador_nit,

    -- Clasificación
    tc.nombre                       AS tipo_causal,
    ts.descripcion                  AS tipo_solicitud,
    reg.nombre                      AS regional,
    tr.nombre                       AS tipo_regional,

    -- Analistas
    an.first_name || ' ' || an.last_name AS analista_asignado,
    ap.first_name || ' ' || ap.last_name AS asignado_por,

    -- Tiempos
    CURRENT_DATE - sol.fecha_recepcion  AS dias_transcurridos,
    CASE
        WHEN sol.fecha_limite < CURRENT_DATE
         AND sol.estado NOT IN ('FIN','ANU','APRO') THEN 'VENCIDA'
        ELSE 'A TIEMPO'
    END AS estado_plazo

FROM solicitudes_solicitud sol
LEFT JOIN solicitudes_asegurado     ase ON ase.id = sol.asegurado_id
LEFT JOIN solicitudes_empleador     emp ON emp.id = sol.empleador_id
LEFT JOIN catalogos_tipocausal      tc  ON tc.id  = sol.tipo_causal_id
LEFT JOIN catalogos_tiposolicitud   ts  ON ts.id  = sol.tipo_solicitud_id
LEFT JOIN catalogos_regional        reg ON reg.id = sol.regional_id
LEFT JOIN catalogos_tiporegional    tr  ON tr.id  = reg.tipo_regional_id
LEFT JOIN accounts_customuser       an  ON an.id  = sol.analista_asignado_id
LEFT JOIN accounts_customuser       ap  ON ap.id  = sol.asignado_por_id
WHERE sol.deleted_at IS NULL
ORDER BY sol.created_at DESC;


-- ------------------------------------------------------------
-- 2.2  KPIs del dashboard — resumen ejecutivo
-- ------------------------------------------------------------
SELECT
    COUNT(*)                                                        AS total_solicitudes,
    COUNT(*) FILTER (WHERE estado = 'BOR')                         AS borradores,
    COUNT(*) FILTER (WHERE estado = 'PEND')                        AS pendientes,
    COUNT(*) FILTER (WHERE estado = 'ASIG')                        AS asignadas,
    COUNT(*) FILTER (WHERE estado = 'REV')                         AS en_revision,
    COUNT(*) FILTER (WHERE estado = 'APRO')                        AS aprobadas,
    COUNT(*) FILTER (WHERE estado = 'RECH')                        AS rechazadas,
    COUNT(*) FILTER (WHERE estado = 'DEV')                         AS devueltas,
    COUNT(*) FILTER (WHERE estado = 'FIN')                         AS finalizadas,
    COUNT(*) FILTER (WHERE estado = 'ANU')                         AS anuladas,
    COUNT(*) FILTER (WHERE fecha_limite < CURRENT_DATE
                       AND estado NOT IN ('FIN','ANU','APRO'))      AS vencidas,
    COALESCE(SUM(monto_total), 0)                                   AS monto_total_global,
    ROUND(AVG(CURRENT_DATE - fecha_recepcion) FILTER (
        WHERE fecha_recepcion IS NOT NULL), 1)                      AS promedio_dias_tramite
FROM solicitudes_solicitud
WHERE deleted_at IS NULL;


-- ------------------------------------------------------------
-- 2.3  Carga de trabajo por analista
--      Muestra cuántas solicitudes tiene asignadas cada analista
--      y cuántas están vencidas
-- ------------------------------------------------------------
SELECT
    u.username,
    u.first_name || ' ' || u.last_name          AS analista,
    COUNT(*)                                     AS total_asignadas,
    COUNT(*) FILTER (WHERE s.estado = 'ASIG')   AS en_asignado,
    COUNT(*) FILTER (WHERE s.estado = 'REV')    AS en_revision,
    COUNT(*) FILTER (WHERE s.fecha_limite < CURRENT_DATE
                      AND s.estado NOT IN ('FIN','ANU','APRO')) AS vencidas,
    COALESCE(SUM(s.monto_total), 0)              AS monto_total
FROM accounts_customuser u
JOIN solicitudes_solicitud s ON s.analista_asignado_id = u.id
WHERE s.deleted_at IS NULL
GROUP BY u.id, u.username, u.first_name, u.last_name
ORDER BY total_asignadas DESC;


-- ------------------------------------------------------------
-- 2.4  Historial de cambios de estado de TODAS las solicitudes
--      Útil para auditoría: quién cambió qué y cuándo
-- ------------------------------------------------------------
SELECT
    sol.numero_solicitud,
    b.created_at                        AS fecha_cambio,
    u.username                          AS usuario,
    u.rol                               AS rol_usuario,
    COALESCE(b.estado_anterior, '—')    AS estado_anterior,
    b.estado_nuevo,
    b.accion,
    COALESCE(b.comentario, '')          AS comentario,
    b.ip_address,
    -- Tiempo entre cambios sucesivos
    b.created_at - LAG(b.created_at) OVER (
        PARTITION BY sol.id ORDER BY b.created_at
    )                                   AS tiempo_desde_cambio_anterior
FROM solicitudes_bitacorasolicitud b
JOIN solicitudes_solicitud sol ON sol.id = b.solicitud_id
LEFT JOIN accounts_customuser u ON u.id = b.usuario_id
ORDER BY sol.numero_solicitud, b.created_at;


-- ------------------------------------------------------------
-- 2.5  Solicitudes con el total de FPCs y monto acumulado
--      Compara monto_total de la solicitud vs suma real de los FPCs
-- ------------------------------------------------------------
SELECT
    sol.numero_solicitud,
    sol.estado,
    sol.monto_total                     AS monto_declarado,
    COUNT(f.id)                         AS cantidad_fpcs,
    COALESCE(SUM(f.total_ganado), 0)    AS suma_total_ganado_fpcs,
    COALESCE(SUM(f.monto_pago), 0)      AS suma_monto_pago_fpcs,
    sol.monto_total - COALESCE(SUM(f.total_ganado), 0) AS diferencia
FROM solicitudes_solicitud sol
LEFT JOIN solicitudes_formulario f
    ON f.solicitud_id = sol.id AND f.deleted_at IS NULL
WHERE sol.deleted_at IS NULL
GROUP BY sol.id, sol.numero_solicitud, sol.estado, sol.monto_total
ORDER BY cantidad_fpcs DESC, sol.created_at DESC;


-- ------------------------------------------------------------
-- 2.6  Análisis de tiempos de resolución por tipo de causal
--      ¿Qué causales tardan más en resolverse?
-- ------------------------------------------------------------
SELECT
    tc.nombre                           AS tipo_causal,
    COUNT(*)                            AS total,
    COUNT(*) FILTER (WHERE sol.estado IN ('APRO','FIN')) AS resueltas,
    ROUND(AVG(
        sol.fecha_resolucion - sol.fecha_recepcion
    ) FILTER (WHERE sol.fecha_resolucion IS NOT NULL), 1) AS promedio_dias_resolucion,
    MIN(sol.fecha_resolucion - sol.fecha_recepcion)
        FILTER (WHERE sol.fecha_resolucion IS NOT NULL) AS minimo_dias,
    MAX(sol.fecha_resolucion - sol.fecha_recepcion)
        FILTER (WHERE sol.fecha_resolucion IS NOT NULL) AS maximo_dias
FROM solicitudes_solicitud sol
JOIN catalogos_tipocausal tc ON tc.id = sol.tipo_causal_id
WHERE sol.deleted_at IS NULL
GROUP BY tc.id, tc.nombre
ORDER BY promedio_dias_resolucion DESC NULLS LAST;


-- ------------------------------------------------------------
-- 2.7  Solicitudes por regional con sus métricas
-- ------------------------------------------------------------
SELECT
    tr.nombre                           AS tipo_regional,
    reg.nombre                          AS regional,
    COUNT(sol.id)                       AS total_solicitudes,
    COUNT(sol.id) FILTER (WHERE sol.estado NOT IN ('FIN','ANU','APRO')) AS en_proceso,
    COUNT(sol.id) FILTER (WHERE sol.estado IN ('APRO','FIN'))           AS resueltas,
    COUNT(sol.id) FILTER (WHERE sol.fecha_limite < CURRENT_DATE
                           AND sol.estado NOT IN ('FIN','ANU','APRO'))  AS vencidas,
    COALESCE(SUM(sol.monto_total), 0)   AS monto_total
FROM catalogos_regional reg
JOIN catalogos_tiporegional tr ON tr.id = reg.tipo_regional_id
LEFT JOIN solicitudes_solicitud sol
    ON sol.regional_id = reg.id AND sol.deleted_at IS NULL
WHERE reg.deleted_at IS NULL
GROUP BY tr.id, tr.nombre, reg.id, reg.nombre
ORDER BY tr.nombre, total_solicitudes DESC;


-- ------------------------------------------------------------
-- 2.8  Asegurados con múltiples solicitudes
--      Detecta asegurados recurrentes
-- ------------------------------------------------------------
SELECT
    ase.cedula,
    ase.nombre || ' ' || COALESCE(ase.ap_paterno,'') AS nombre,
    ase.cua,
    COUNT(sol.id)                       AS total_solicitudes,
    MIN(sol.created_at::date)           AS primera_solicitud,
    MAX(sol.created_at::date)           AS ultima_solicitud,
    COALESCE(SUM(sol.monto_total), 0)   AS monto_acumulado,
    STRING_AGG(DISTINCT sol.estado, ', ' ORDER BY sol.estado) AS estados
FROM solicitudes_asegurado ase
JOIN solicitudes_solicitud sol ON sol.asegurado_id = ase.id AND sol.deleted_at IS NULL
WHERE ase.deleted_at IS NULL
GROUP BY ase.id, ase.cedula, ase.nombre, ase.ap_paterno, ase.cua
HAVING COUNT(sol.id) > 1
ORDER BY total_solicitudes DESC;


-- ------------------------------------------------------------
-- 2.9  Documentos pendientes de subir por solicitud
--      Solicitudes que tienen documentos marcados pero sin archivo
-- ------------------------------------------------------------
SELECT
    sol.numero_solicitud,
    sol.estado,
    doc.codigo              AS codigo_documento,
    doc.descripcion         AS documento,
    ed.nombre               AS estado_doc,
    dr.observacion,
    dr.created_at::date     AS fecha_registro
FROM solicitudes_documentorespaldo dr
JOIN solicitudes_solicitud sol ON sol.id = dr.solicitud_id
JOIN catalogos_documento doc ON doc.id = dr.documento_id
LEFT JOIN catalogos_estadodocumentacion ed ON ed.id = dr.estado_documentacion_id
WHERE dr.archivo = ''
  AND dr.deleted_at IS NULL
  AND sol.deleted_at IS NULL
  AND sol.estado NOT IN ('FIN', 'ANU')
ORDER BY sol.numero_solicitud, doc.codigo;


-- ------------------------------------------------------------
-- 2.10  Ranking de actividad por usuario (auditoría)
--       Quién ha generado más movimientos en el sistema
-- ------------------------------------------------------------
SELECT
    u.username,
    u.first_name || ' ' || u.last_name AS nombre,
    u.rol,
    COUNT(b.id)                         AS total_acciones,
    COUNT(DISTINCT b.solicitud_id)      AS solicitudes_gestionadas,
    MIN(b.created_at)::date             AS primera_accion,
    MAX(b.created_at)::date             AS ultima_accion,
    -- Distribución de acciones
    COUNT(*) FILTER (WHERE b.accion = 'CREACION')               AS creaciones,
    COUNT(*) FILTER (WHERE b.accion LIKE 'CAMBIO_ESTADO:%')     AS cambios_estado
FROM accounts_customuser u
JOIN solicitudes_bitacorasolicitud b ON b.usuario_id = u.id
GROUP BY u.id, u.username, u.first_name, u.last_name, u.rol
ORDER BY total_acciones DESC;


-- ------------------------------------------------------------
-- 2.11  Embudo de flujo: cuántas solicitudes pasan por cada estado
--        y cuántas se "caen" (ANU/RECH) antes de finalizar
-- ------------------------------------------------------------
WITH estados_conteo AS (
    SELECT
        estado_nuevo                    AS estado,
        COUNT(DISTINCT solicitud_id)    AS solicitudes_que_llegaron
    FROM solicitudes_bitacorasolicitud
    GROUP BY estado_nuevo
)
SELECT
    e.estado,
    e.solicitudes_que_llegaron,
    ROUND(100.0 * e.solicitudes_que_llegaron /
        NULLIF(MAX(e.solicitudes_que_llegaron) OVER (), 0), 1) AS pct_del_total
FROM estados_conteo e
ORDER BY
    CASE e.estado
        WHEN 'BOR'  THEN 1 WHEN 'PEND' THEN 2 WHEN 'ASIG' THEN 3
        WHEN 'REV'  THEN 4 WHEN 'APRO' THEN 5 WHEN 'FIN'  THEN 6
        WHEN 'DEV'  THEN 7 WHEN 'RECH' THEN 8 WHEN 'ANU'  THEN 9
        ELSE 10
    END;


-- ------------------------------------------------------------
-- 2.12  Solicitudes sin analista asignado y con más de N días
--       pendientes (candidatas a reasignación urgente)
-- ------------------------------------------------------------
SELECT
    sol.numero_solicitud,
    sol.estado,
    sol.prioridad,
    CURRENT_DATE - sol.created_at::date         AS dias_en_sistema,
    sol.fecha_limite,
    CASE WHEN sol.fecha_limite < CURRENT_DATE THEN 'VENCIDA' ELSE 'VIGENTE' END AS plazo,
    ase.nombre || ' ' || COALESCE(ase.ap_paterno,'') AS asegurado,
    cr.username                                 AS creador
FROM solicitudes_solicitud sol
LEFT JOIN solicitudes_asegurado ase ON ase.id = sol.asegurado_id
LEFT JOIN accounts_customuser   cr  ON cr.id  = sol.usuario_creador_id
WHERE sol.analista_asignado_id IS NULL
  AND sol.estado IN ('PEND', 'BOR')
  AND sol.deleted_at IS NULL
  AND CURRENT_DATE - sol.created_at::date > 3   -- más de 3 días sin asignar
ORDER BY sol.prioridad DESC, dias_en_sistema DESC;


-- ============================================================
--  SECCIÓN 3: REGISTROS ELIMINADOS (SOFT DELETE)
-- ============================================================


-- ------------------------------------------------------------
-- 3.1  Resumen: cuántos registros eliminados hay por tabla
-- ------------------------------------------------------------
SELECT tabla, COUNT(*) AS total_eliminados, MAX(deleted_at) AS ultimo_eliminado
FROM (
    SELECT 'solicitudes_solicitud'      AS tabla, deleted_at FROM solicitudes_solicitud      WHERE deleted_at IS NOT NULL
    UNION ALL
    SELECT 'solicitudes_asegurado'      AS tabla, deleted_at FROM solicitudes_asegurado      WHERE deleted_at IS NOT NULL
    UNION ALL
    SELECT 'solicitudes_empleador'      AS tabla, deleted_at FROM solicitudes_empleador      WHERE deleted_at IS NOT NULL
    UNION ALL
    SELECT 'solicitudes_solicitante'    AS tabla, deleted_at FROM solicitudes_solicitante    WHERE deleted_at IS NOT NULL
    UNION ALL
    SELECT 'solicitudes_formulario'     AS tabla, deleted_at FROM solicitudes_formulario     WHERE deleted_at IS NOT NULL
    UNION ALL
    SELECT 'solicitudes_documentorespaldo' AS tabla, deleted_at FROM solicitudes_documentorespaldo WHERE deleted_at IS NOT NULL
    UNION ALL
    SELECT 'catalogos_tipocausal'       AS tabla, deleted_at FROM catalogos_tipocausal       WHERE deleted_at IS NOT NULL
    UNION ALL
    SELECT 'catalogos_tiposolicitud'    AS tabla, deleted_at FROM catalogos_tiposolicitud    WHERE deleted_at IS NOT NULL
    UNION ALL
    SELECT 'catalogos_regional'         AS tabla, deleted_at FROM catalogos_regional         WHERE deleted_at IS NOT NULL
) sub
GROUP BY tabla
ORDER BY total_eliminados DESC;


-- ------------------------------------------------------------
-- 3.2  Solicitudes eliminadas — detalle completo
--      Muestra quién eliminó, cuándo y todos los datos clave
-- ------------------------------------------------------------
SELECT
    sol.id,
    sol.numero_solicitud,
    sol.estado                                      AS estado_al_eliminar,
    sol.prioridad,
    sol.deleted_at                                  AS fecha_eliminacion,
    sol.deleted_at::date - sol.created_at::date     AS dias_de_vida,

    -- Quién eliminó
    ue.username                                     AS eliminado_por,
    ue.rol                                          AS rol_eliminador,

    -- Quién creó
    uc.username                                     AS creado_por,

    -- Datos del asegurado (aunque también puede estar eliminado)
    ase.cedula                                      AS asegurado_ci,
    ase.nombre || ' ' || COALESCE(ase.ap_paterno,'') AS asegurado_nombre,

    -- Empleador
    emp.nombre_razon_social                         AS empleador,

    -- Clasificación
    tc.nombre                                       AS tipo_causal,
    reg.nombre                                      AS regional,

    sol.monto_total,
    sol.created_at::date                            AS fecha_creacion

FROM solicitudes_solicitud sol
LEFT JOIN accounts_customuser  ue  ON ue.id  = sol.usuario_eliminador_id
LEFT JOIN accounts_customuser  uc  ON uc.id  = sol.usuario_creador_id
LEFT JOIN solicitudes_asegurado ase ON ase.id = sol.asegurado_id
LEFT JOIN solicitudes_empleador emp ON emp.id = sol.empleador_id
LEFT JOIN catalogos_tipocausal  tc  ON tc.id  = sol.tipo_causal_id
LEFT JOIN catalogos_regional    reg ON reg.id = sol.regional_id
WHERE sol.deleted_at IS NOT NULL
ORDER BY sol.deleted_at DESC;


-- ------------------------------------------------------------
-- 3.3  Todos los registros eliminados — vista unificada por tabla
--      Referencia rápida para auditoría cross-table
-- ------------------------------------------------------------
SELECT
    'solicitud'     AS tipo,
    sol.id,
    sol.numero_solicitud                            AS referencia,
    sol.estado                                      AS detalle,
    sol.deleted_at,
    ue.username                                     AS eliminado_por
FROM solicitudes_solicitud sol
LEFT JOIN accounts_customuser ue ON ue.id = sol.usuario_eliminador_id
WHERE sol.deleted_at IS NOT NULL

UNION ALL

SELECT
    'asegurado'     AS tipo,
    ase.id,
    ase.cedula                                      AS referencia,
    ase.nombre || ' ' || COALESCE(ase.ap_paterno,'') AS detalle,
    ase.deleted_at,
    ue.username
FROM solicitudes_asegurado ase
LEFT JOIN accounts_customuser ue ON ue.id = ase.usuario_eliminador_id
WHERE ase.deleted_at IS NOT NULL

UNION ALL

SELECT
    'empleador'     AS tipo,
    emp.id,
    emp.nit                                         AS referencia,
    emp.nombre_razon_social                         AS detalle,
    emp.deleted_at,
    ue.username
FROM solicitudes_empleador emp
LEFT JOIN accounts_customuser ue ON ue.id = emp.usuario_eliminador_id
WHERE emp.deleted_at IS NOT NULL

UNION ALL

SELECT
    'formulario'    AS tipo,
    f.id,
    f.numero                                        AS referencia,
    f.periodo                                       AS detalle,
    f.deleted_at,
    ue.username
FROM solicitudes_formulario f
LEFT JOIN accounts_customuser ue ON ue.id = f.usuario_eliminador_id
WHERE f.deleted_at IS NOT NULL

UNION ALL

SELECT
    'documento'     AS tipo,
    dr.id,
    COALESCE(dr.observacion, 'sin descripcion')     AS referencia,
    dr.archivo                                      AS detalle,
    dr.deleted_at,
    ue.username
FROM solicitudes_documentorespaldo dr
LEFT JOIN accounts_customuser ue ON ue.id = dr.usuario_eliminador_id
WHERE dr.deleted_at IS NOT NULL

ORDER BY deleted_at DESC;


-- ------------------------------------------------------------
-- 3.4  Restaurar un registro eliminado (soft delete)
--      Descomentar y ajustar el id / tabla según necesidad
-- ------------------------------------------------------------
-- UPDATE solicitudes_solicitud
-- SET deleted_at = NULL, usuario_eliminador_id = NULL
-- WHERE id = 99;   -- <-- cambiar por el id del registro a restaurar

-- UPDATE solicitudes_asegurado
-- SET deleted_at = NULL, usuario_eliminador_id = NULL
-- WHERE id = 99;

-- UPDATE solicitudes_empleador
-- SET deleted_at = NULL, usuario_eliminador_id = NULL
-- WHERE id = 99;

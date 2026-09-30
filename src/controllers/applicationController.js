const pool = require('../config/db');
const PriorityService = require('../services/priorityService');

class ApplicationController {
    
    // POST /applications
    static async createApplication(req, res, next) {
        const connection = await pool.getConnection();
        try {
            const { candidatoId, vacancyId, source, coverLetter } = req.body;

            if (!candidatoId || !vacancyId || !source || !coverLetter) {
                return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
            }

            const allowedSources = ['REFERRAL', 'INTERNAL', 'JOB_BOARD', 'OTHER'];
            if (!allowedSources.includes(source)) {
                return res.status(400).json({ error: 'Fuente de postulación no permitida.' });
            }

            await connection.beginTransaction();

            const [candidates] = await connection.execute('SELECT * FROM candidato WHERE id = ?', [candidatoId]);
            if (candidates.length === 0) return res.status(404).json({ error: 'El candidato no existe.' });
            const candidate = candidates[0];

            const [vacancies] = await connection.execute('SELECT * FROM vacante WHERE id = ?', [vacancyId]);
            if (vacancies.length === 0) return res.status(404).json({ error: 'La vacante no existe.' });
            const vacancy = vacancies[0];

            if (vacancy.estado !== 'OPEN') {
                return res.status(400).json({ error: 'La vacante no está abierta (OPEN).' });
            }

            // Regla de duplicidad
            const [existingApps] = await connection.execute(
                'SELECT * FROM postulacion WHERE candidato_id = ? AND vacante_id = ? ORDER BY fecha_creacion DESC',
                [candidatoId, vacancyId]
            );

            if (existingApps.length > 0) {
                const lastApp = existingApps[0];
                const activeStates = ['RECEIVED', 'IN_REVIEW', 'HIRED'];
                if (activeStates.includes(lastApp.estado)) {
                    return res.status(400).json({ error: 'El candidato ya tiene una postulación activa para esta vacante.' });
                }
                if (lastApp.estado === 'REJECTED') {
                    const rejectedDate = new Date(lastApp.fecha_ultima_actualizacion_estado);
                    const diffDays = Math.ceil(Math.abs(new Date() - rejectedDate) / (1000 * 60 * 60 * 24));
                    if (diffDays < 30) {
                        return res.status(400).json({ error: 'Deben transcurrir 30 días desde la postulación rechazada.' });
                    }
                }
            }

            // Postulaciones activas en OTRAS vacantes
            const [activeOtherApps] = await connection.execute(
                'SELECT COUNT(*) as count FROM postulacion WHERE candidato_id = ? AND estado IN ("RECEIVED", "IN_REVIEW")',
                [candidatoId]
            );
            const activeCount = activeOtherApps[0].count;

            // Calcular puntaje
            const { score, priority } = PriorityService.computeScoreAndPriority(candidate, vacancy, source, coverLetter, activeCount);

            // Insertar
            const [result] = await connection.execute(
                `INSERT INTO postulacion (candidato_id, vacante_id, carta_presentacion, fuente, puntaje, prioridad, estado, fecha_creacion, fecha_ultima_actualizacion_estado) 
                VALUES (?, ?, ?, ?, ?, ?, 'RECEIVED', NOW(), NOW())`,
                [candidatoId, vacancyId, coverLetter, source, score, priority]
            );

            await connection.commit();

            return res.status(201).json({ message: 'Postulación registrada exitosamente', applicationId: result.insertId, score, priority, status: 'RECEIVED' });
        } catch (error) {
            if (connection) await connection.rollback();
            next(error); // Pasa al middleware de errores
        } finally {
            if (connection) connection.release();
        }
    }

    // GET /applications
    static async getApplications(req, res, next) {
        try {
            const { status, vacancyId } = req.query;
            let query = `
                SELECT p.*, c.nombre AS candidato_nombre, c.correo_electronico AS candidato_correo, v.titulo_cargo AS vacante_titulo
                FROM postulacion p
                JOIN candidato c ON p.candidato_id = c.id
                JOIN vacante v ON p.vacante_id = v.id
                WHERE 1=1
            `;
            const params = [];

            if (status) { query += ' AND p.estado = ?'; params.push(status); }
            if (vacancyId) { query += ' AND p.vacante_id = ?'; params.push(vacancyId); }

            query += ' ORDER BY p.puntaje DESC, p.fecha_creacion ASC';

            const [rows] = await pool.execute(query, params);
            return res.status(200).json(rows);
        } catch (error) {
            next(error);
        }
    }

    // PUT /applications/:id/status
    static async updateStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const allowedStatuses = ['RECEIVED', 'IN_REVIEW', 'REJECTED', 'HIRED'];

            if (!allowedStatuses.includes(status)) return res.status(400).json({ error: 'Estado no permitido.' });

            const [applications] = await pool.execute('SELECT * FROM postulacion WHERE id = ?', [id]);
            if (applications.length === 0) return res.status(404).json({ error: 'Postulación no encontrada.' });

            const currentApp = applications[0];
            if (currentApp.estado === 'REJECTED' || currentApp.estado === 'HIRED') {
                return res.status(400).json({ error: 'No se puede modificar una postulación en estado final (REJECTED o HIRED).' });
            }

            await pool.execute('UPDATE postulacion SET estado = ?, fecha_ultima_actualizacion_estado = NOW() WHERE id = ?', [status, id]);
            return res.status(200).json({ message: 'Estado actualizado exitosamente.' });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = ApplicationController;

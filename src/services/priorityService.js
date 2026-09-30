class PriorityService {
    /**
     * Calcula el puntaje y la prioridad de una postulación
     */
    static computeScoreAndPriority(candidate, vacancy, source, coverLetter, activeCount) {
        let score = 0;

        // 1. Años de experiencia >= mínimos exigidos
        if (candidate.anos_experiencia >= vacancy.anos_minimos_experiencia) score += 4;

        // 2. Fuente de postulación
        if (source === 'REFERRAL') score += 3;
        else if (source === 'INTERNAL') score += 2;

        // 3. Carta de presentación (palabras clave y longitud)
        const lowerCover = coverLetter.toLowerCase();
        if (lowerCover.includes('node') || lowerCover.includes('sql') || lowerCover.includes('api')) score += 2;
        if (coverLetter.length > 500) score += 1;

        // 4. Postulaciones activas previas en otras vacantes
        if (activeCount >= 3) score -= 2;

        // El puntaje total nunca puede ser negativo
        if (score < 0) score = 0;

        // 5. Determinar prioridad
        let priority = 'LOW';
        if (score >= 7) priority = 'TOP';
        else if (score >= 5) priority = 'HIGH';
        else if (score >= 3) priority = 'MEDIUM';

        return { score, priority };
    }
}

module.exports = PriorityService;

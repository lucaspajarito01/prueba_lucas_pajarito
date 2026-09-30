const PriorityService = require('../src/services/priorityService');

describe('PriorityService - Cálculo de puntaje y prioridad', () => {
    
    test('Debería calcular correctamente la prioridad TOP con puntaje >= 7', () => {
        const candidate = { anos_experiencia: 5 };
        const vacancy = { anos_minimos_experiencia: 2 };
        const source = 'REFERRAL';
        const coverLetter = 'I have extensive experience building scalable REST APIs and handling database migrations with Node.js and SQL. (Más de 500 caracteres para asegurar la regla adicional de longitud en la carta de presentación del candidato postulándose al puesto vacante para cumplir con los requisitos de la prueba técnica solicitada por la empresa evaluadora).';
        const activeCount = 0;

        const result = PriorityService.computeScoreAndPriority(candidate, vacancy, source, coverLetter, activeCount);
        
        // Experiencia (+4) + Referral (+3) + Palabras clave node/sql/api (+2) + Longitud > 500 (+1) = 10 -> TOP
        expect(result.score).toBeGreaterThanOrEqual(7);
        expect(result.priority).toBe('TOP');
    });

    test('Debería aplicar penalización por tener 3 o más postulaciones activas', () => {
        const candidate = { anos_experiencia: 2 };
        const vacancy = { anos_minimos_experiencia: 2 };
        const source = 'JOB_BOARD';
        const coverLetter = 'Cover letter without keywords.';
        const activeCount = 3;

        const result = PriorityService.computeScoreAndPriority(candidate, vacancy, source, coverLetter, activeCount);
        
        // Experiencia (+4) - Penalización por activas (-2) = 2 -> LOW
        expect(result.score).toBe(2);
        expect(result.priority).toBe('LOW');
    });

    test('El puntaje nunca debe ser negativo', () => {
        const candidate = { anos_experiencia: 0 };
        const vacancy = { anos_minimos_experiencia: 3 };
        const source = 'OTHER';
        const coverLetter = 'Short';
        const activeCount = 5; // Aplica -2, pero el puntaje mínimo es 0

        const result = PriorityService.computeScoreAndPriority(candidate, vacancy, source, coverLetter, activeCount);
        
        expect(result.score).toBe(0);
        expect(result.priority).toBe('LOW');
    });

});

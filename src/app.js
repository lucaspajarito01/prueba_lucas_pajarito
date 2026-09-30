const express = require('express');
const applicationRoutes = require('./routes/applicationRoutes');
const errorHandler = require('./middlewares/errorHandler');
require('dotenv').config();

const app = express();

// Middlewares globales
app.use(express.json());

// Rutas
app.use('/applications', applicationRoutes);

// Middleware para manejo de errores (debe ir después de las rutas)
app.use(errorHandler);

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});

module.exports = app;

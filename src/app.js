import express from 'express'
import cookieParser from 'cookie-parser'
import authRoutes from './routes/auth_routes.js'

import { InternalUserRouter } from './routes/internal_user_routes.js'
import { PeriodoRouter } from './routes/Periodo_routes.js'
import { UsuarioXPeriodoRouter } from './routes/UsuarioXPeriodo_Routes.js'
import { ResumenHorasRouter } from './routes/Resumen_Horas_routes.js'
import { HorarioRouter } from './routes/Horario_routes.js'
import { HorasExtraordinariasRouter } from './routes/Horas_Extraordinarias_Routes.js'
import {Seguimiento_SemanalRouter} from './routes/Seguimiento_Semanal_Routes.js'
import { AlertaRouter } from './routes/Alerta_Routes.js'
import { corsMiddleware } from './middlewares/cors.js'
import { Parametro_HorarioRouter } from './routes/Parametro_Horario_Routes.js'
import { authMiddleware } from './middlewares/auth.js';



const app = express()

// middleware
app.use(express.json())
app.use(corsMiddleware())
app.use(cookieParser())
app.use(authRoutes);

app.use( InternalUserRouter,PeriodoRouter,UsuarioXPeriodoRouter,ResumenHorasRouter,HorarioRouter,HorasExtraordinariasRouter,Seguimiento_SemanalRouter,AlertaRouter, Parametro_HorarioRouter)

export default app
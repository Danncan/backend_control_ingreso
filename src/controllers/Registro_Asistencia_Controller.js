import { Registro_Asistencia } from "../models/Registro_Asistencia";
 
 export class Registro_Asistencia_Controller {
     
         //Obtener registros activos
         static async getRegistros(req, res) {
             try {
                 const registros = await Registro_Asistencia.getRegistros();
                 res.status(200).json(registros);
             } catch (error) {
                 res.status(500).json({ message: error.message });
             }
         }
     
         //Obtener un registro por ID, solo si no está eliminado
         static async getById(req, res) {
             try {
                 const id = req.params.id;
                 const registro = await Registro_Asistencia.getById(id);
     
                 if (!registro) {
                     res.status(404).json({ message: "Registro de asistencia no encontrado" });
                 } else {
                     res.status(200).json(registro);
                 }
             } catch (error) {
                 res.status(500).json({ message: error.message });
             }
         }
     
         //Crear un nuevo registro
         static async create(req, res) {
             try {
                 const data = req.body;
                 const registro = await Registro_Asistencia.create(data);
                 res.status(201).json(registro);
             } catch (error) {
                 res.status(500).json({ message: error.message });
             }
         }
     
         //Actualizar un registro solo si no está eliminado
         static async update(req, res) {
             try {
                 const id = req.params.id;
                 const data = req.body;
                 const registro = await Registro_Asistencia.update(id, data);
     
                 if (!registro) {
                     res.status(404).json({ message: "Registro de asistencia no encontrado" });
                 } else {
                     res.status(200).json(registro);
                 }
             } catch (error) {
                 res.status(500).json({ message: error.message });
             }
         }
     
         //Eliminar (marcar como eliminado) solo si no está eliminado
         static async delete(req, res) {
             try {
                 const id = req.params.id;
                 const registro = await Registro_Asistencia.delete(id);
     
                 if (!registro) {
                     res.status(404).json({ message: "Registro de asistencia no encontrado" });
                 } else {
                     res.status(204).end();
                 }
             } catch (error) {
                 res.status(500).json({ message: error.message });
             }
         }
 
         static async getRegistroAbierto(req, res) {
             try {
                 const usuarioXPeriodoId = req.params.usuarioXPeriodoId;
                 const fecha = req.params.fecha;
                 const registro = await Registro_Asistencia.getRegistroAbierto(usuarioXPeriodoId, fecha);
     
                 if (!registro) {
                     res.status(404).json({ message: "Registro de asistencia no encontrado" });
                 } else {
                     res.status(200).json(registro);
                 }
             } catch (error) {
                 res.status(500).json({ message: error.message });
             }
         }
     }
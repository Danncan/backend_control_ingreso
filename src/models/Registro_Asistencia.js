import { Registro_Asistencia } from "../schemas/Registro_Asistencia_Schema";
 
 export class Registro_Asistencia {
  
     //Obtener registros activos
     static async getRegistros() {
         try {
             return await Registro_Asistencia.findAll({
                 where: { Registro_IsDeleted: false }
             });
         } catch (error) {
             throw new Error(`Error al obtener registros de asistencia: ${error.message}`);
         }
     }
 
     //Obtener un registro por ID, solo si no está eliminado
     static async getById(id) {
         try {
             return await Registro_Asistencia.findOne({
                 where: { Registro_ID: id, Registro_IsDeleted: false }
             });
         } catch (error) {
             throw new Error(`Error al obtener registro de asistencia: ${error.message}`);
         }
     }
 
     //Crear un nuevo registro
     static async create(data) {
         try {
             return await Registro_Asistencia.create(data);
         } catch (error) {
             throw new Error(`Error al crear registro de asistencia: ${error.message}`);
         }
     }
 
     //Actualizar un registro solo si no está eliminado
     static async update(id, data) {
         try {
             const registro = await this.getById(id);
 
             if (!registro) return null;
 
             const [rowsUpdated] = await Registro_Asistencia.update(data, {
                 where: { Registro_ID: id, Registro_IsDeleted: false }
             });
 
             if (rowsUpdated === 0) return null;
             return await this.getById(id);
         } catch (error) {
             throw new Error(`Error al actualizar registro de asistencia: ${error.message}`);
         }
     }
 
     //Eliminar (marcar como eliminado) solo si no está eliminado
     static async delete(id) {
         try {
             const registro = await this.getById(id);
 
             if (!registro) return null;
 
             const data = { Registro_IsDeleted: true };
             const [rowsUpdated] = await Registro_Asistencia.update(data, {
                 where: { Registro_ID: id, Registro_IsDeleted: false }
             });
 
             if (rowsUpdated === 0) return null;
             return true;
         } catch (error) {
             throw new Error(`Error al eliminar registro de asistencia: ${error.message}`);
         }
     }
 
      // Nuevo método: Obtener el registro abierto para un usuario x período
     // Si se pasa la fecha, se filtra entre el inicio y fin del día
     static async getRegistroAbierto(usuarioXPeriodoId, fecha) {
         try {
             const whereClause = {
                 usuarioXPeriodoId: usuarioXPeriodoId,
                 Registro_IsDeleted: false,
                 Registro_Salida: null
             };
 
             if (fecha) {
                 const start = new Date(fecha);
                 start.setHours(0, 0, 0, 0);
                 const end = new Date(fecha);
                 end.setHours(23, 59, 59, 999);
                 whereClause.Registro_fecha = { [Op.between]: [start, end] };
             }
 
             return await Registro_Asistencia.findOne({ where: whereClause });
         } catch (error) {
             throw new Error(`Error al obtener registro abierto: ${error.message}`);
         }
     }
 
     
 }